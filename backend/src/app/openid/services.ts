import { randomBytes } from "node:crypto";
import jose from "node-jose";
import { eq, and } from "drizzle-orm";
import { PUBLIC_KEY } from "./utils/certs.js";
import { env } from "../../utils/env-validate.js";
import { db } from "../../db/index.js";
import {
  oauthClientsTable,
  authCodesTable,
  consentTable,
  refreshTokensTable,
  usersTable,
} from "../../db/schema.js";
import { oauthClientService } from "../oauth/services.js";
import { parseScopes, validateScopes } from "./utils/scopes.js";
import { generateOAuthAccessToken, generateIdToken } from "./utils/tokens.js";
import ApiError from "../../utils/api-error.js";
import type {
  AuthorizeRequestModel,
  ConsentRequestModel,
  TokenRequestModel,
} from "./models.js";

class OpenIdService {
  async handleOpenIdConfig() {
    const issuer = env.ISSUER;
    return {
      issuer,
      authorization_endpoint: `${issuer}/o/authorize`,
      token_endpoint: `${issuer}/o/token`,
      userinfo_endpoint: `${issuer}/o/userinfo`,
      jwks_uri: `${issuer}/auth/certs`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      scopes_supported: ["openid", "profile", "email"],
      token_endpoint_auth_methods_supported: ["client_secret_post"],
      claims_supported: [
        "sub",
        "name",
        "given_name",
        "family_name",
        "email",
        "email_verified",
        "gender",
        "birthdate",
      ],
    };
  }

  async handleJwks() {
    const key = await jose.JWK.asKey(PUBLIC_KEY, "pem");
    return key;
  }

  /**
   * Authorization endpoint — validates client, checks consent, returns auth code or consent prompt.
   */
  async handleAuthorize(data: AuthorizeRequestModel, userId: string | null) {
    const { client_id, redirect_uri, response_type, scope, state } = data;

    // 1. Only "code" response_type supported (Authorization Code Flow)
    if (response_type !== "code") {
      throw ApiError.badRequest(
        "Unsupported response_type. Only 'code' is supported.",
      );
    }

    // 2. Validate scopes
    const scopes = parseScopes(scope);
    // console.log({scopes})
    // if (!validateScopes(scopes) || !scopes.includes("openid")) {
    //   throw ApiError.badRequest(
    //     "Invalid scopes. Must include 'openid'. Supported: openid, profile, email.",
    //   );
    // }

    // 3. Validate client exists
    const [client] = await db
      .select()
      .from(oauthClientsTable)
      .where(eq(oauthClientsTable.clientId, client_id));

    if (!client) {
      throw ApiError.badRequest("Invalid client_id");
    }

    // 4. Validate redirect_uri matches registered URIs
    if (!client.redirectUris.includes(redirect_uri)) {
      throw ApiError.badRequest(
        "redirect_uri does not match any registered redirect URIs",
      );
    }

    // 5. If user is not logged in, return login required
    if (!userId) {
      return {
        action: "login_required" as const,
        loginUrl: `${env.ISSUER}/auth/sign-in`,
        returnTo: `${env.ISSUER}/o/authorize?${new URLSearchParams({
          client_id,
          redirect_uri,
          response_type,
          scope,
          ...(state ? { state } : {}),
        }).toString()}`,
      };
    }

    // 6. Check if user has already consented to these scopes for this client
    const [existingConsent] = await db
      .select()
      .from(consentTable)
      .where(
        and(
          eq(consentTable.userId, userId),
          eq(consentTable.clientId, client.id),
        ),
      );

    // If consent already covers the requested scopes, issue code directly
    if (
      existingConsent &&
      scopes.every((s) => existingConsent.scopes.includes(s))
    ) {
      const code = await this.generateAuthCode(
        userId,
        client.id,
        redirect_uri,
        scopes,
      );
      return {
        action: "redirect" as const,
        redirectUrl: this.buildRedirectUrl(redirect_uri, code, state),
      };
    }

    // 7. No consent — prompt the user
    return {
      action: "consent_required" as const,
      client: {
        appName: client.appName,
        websiteUrl: client.websiteUrl,
      },
      scopes,
      client_id,
      redirect_uri,
      state,
    };
  }

  /**
   * Handle user consent decision.
   */
  async handleConsent(data: ConsentRequestModel, userId: string) {
    const { client_id, redirect_uri, scope, state, approved } = data;
    const scopes = parseScopes(scope);

    // Validate client
    const [client] = await db
      .select()
      .from(oauthClientsTable)
      .where(eq(oauthClientsTable.clientId, client_id));

    if (!client) {
      throw ApiError.badRequest("Invalid client_id");
    }

    if (!client.redirectUris.includes(redirect_uri)) {
      throw ApiError.badRequest("Invalid redirect_uri");
    }

    // If user denied consent
    if (!approved) {
      const url = new URL(redirect_uri);
      url.searchParams.set("error", "access_denied");
      url.searchParams.set("error_description", "User denied consent");
      if (state) url.searchParams.set("state", state);
      return { redirectUrl: url.toString() };
    }

    // Store consent (upsert)
    const [existingConsent] = await db
      .select()
      .from(consentTable)
      .where(
        and(
          eq(consentTable.userId, userId),
          eq(consentTable.clientId, client.id),
        ),
      );

    if (existingConsent) {
      // Merge scopes
      const mergedScopes = [...new Set([...existingConsent.scopes, ...scopes])];
      await db
        .update(consentTable)
        .set({ scopes: mergedScopes })
        .where(eq(consentTable.id, existingConsent.id));
    } else {
      await db.insert(consentTable).values({
        userId,
        clientId: client.id,
        scopes,
      });
    }

    // Generate auth code and redirect
    const code = await this.generateAuthCode(
      userId,
      client.id,
      redirect_uri,
      scopes,
    );
    return { redirectUrl: this.buildRedirectUrl(redirect_uri, code, state) };
  }

  /**
   * Token endpoint — exchanges auth code or refresh token for tokens.
   */
  async handleTokenExchange(data: TokenRequestModel) {
    const { grant_type, client_id, client_secret } = data;

    // Validate client credentials
    const client = await oauthClientService.validateClient(
      client_id,
      client_secret,
    );
    console.log({ client });

    if (grant_type === "authorization_code") {
      return this.handleAuthCodeExchange(data, client);
    } else if (grant_type === "refresh_token") {
      return this.handleRefreshTokenExchange(data, client);
    }

    throw ApiError.badRequest("Invalid grant_type");
  }

  /**
   * UserInfo endpoint — returns user claims based on access token scopes.
   */
  async handleUserInfo(userId: string, scopes: string[]) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    const { getClaimsForScopes } = await import("./utils/scopes.js");
    return getClaimsForScopes(user, scopes);
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private async generateAuthCode(
    userId: string,
    clientId: string,
    redirectUri: string,
    scopes: string[],
  ): Promise<string> {
    const code = randomBytes(32).toString("hex");
    await db.insert(authCodesTable).values({
      code,
      userId,
      clientId,
      redirectUri,
      scopes,
      expiresAt: new Date(Date.now() + 60 * 1000), // 60 seconds
    });
    return code;
  }

  private buildRedirectUrl(
    redirectUri: string,
    code: string,
    state?: string,
  ): string {
    const url = new URL(redirectUri);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);
    return url.toString();
  }

  private async handleAuthCodeExchange(
    data: TokenRequestModel,
    client: typeof oauthClientsTable.$inferSelect,
  ) {
    const { code, redirect_uri } = data;

    if (!code || !redirect_uri) {
      throw ApiError.badRequest(
        "code and redirect_uri are required for authorization_code grant",
      );
    }

    // Look up the auth code
    const [authCode] = await db
      .select()
      .from(authCodesTable)
      .where(eq(authCodesTable.code, code));

    if (!authCode) {
      throw ApiError.badRequest("Invalid authorization code");
    }

    // Validate: not used, not expired, client matches, redirect_uri matches
    if (authCode.used) {
      throw ApiError.badRequest("Authorization code already used");
    }
    // TODO
    // if (new Date() > authCode.expiresAt) {
    //   throw ApiError.badRequest("Authorization code expired");
    // }
    if (authCode.clientId !== client.id) {
      throw ApiError.badRequest(
        "Authorization code was not issued to this client",
      );
    }
    if (authCode.redirectUri !== redirect_uri) {
      throw ApiError.badRequest("redirect_uri mismatch");
    }

    // Mark code as used
    await db
      .update(authCodesTable)
      .set({ used: true })
      .where(eq(authCodesTable.id, authCode.id));

    // Fetch user for id_token generation
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, authCode.userId));

    if (!user) {
      throw ApiError.internal("User not found");
    }

    // Generate tokens
    const accessToken = generateOAuthAccessToken(
      user.id,
      client.clientId,
      authCode.scopes,
    );
    const idToken = generateIdToken(user, client.clientId, authCode.scopes);
    const refreshToken = randomBytes(32).toString("hex");

    // Store refresh token
    await db.insert(refreshTokensTable).values({
      token: refreshToken,
      userId: user.id,
      clientId: client.id,
      scopes: authCode.scopes,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 600,
      refresh_token: refreshToken,
      id_token: idToken,
      scope: authCode.scopes.join(" "),
    };
  }

  private async handleRefreshTokenExchange(
    data: TokenRequestModel,
    client: typeof oauthClientsTable.$inferSelect,
  ) {
    const { refresh_token } = data;

    if (!refresh_token) {
      throw ApiError.badRequest(
        "refresh_token is required for refresh_token grant",
      );
    }

    // Look up the refresh token
    const [storedToken] = await db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.token, refresh_token));

    if (!storedToken) {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    if (storedToken.revoked) {
      throw ApiError.unauthorized("Refresh token has been revoked");
    }
    if (new Date() > storedToken.expiresAt) {
      throw ApiError.unauthorized("Refresh token expired");
    }
    if (storedToken.clientId !== client.id) {
      throw ApiError.unauthorized(
        "Refresh token was not issued to this client",
      );
    }

    // Fetch user
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, storedToken.userId));

    if (!user) {
      throw ApiError.internal("User not found");
    }

    // Rotate: revoke old, issue new refresh token
    await db
      .update(refreshTokensTable)
      .set({ revoked: true })
      .where(eq(refreshTokensTable.id, storedToken.id));

    const newRefreshToken = randomBytes(32).toString("hex");
    await db.insert(refreshTokensTable).values({
      token: newRefreshToken,
      userId: user.id,
      clientId: client.id,
      scopes: storedToken.scopes ?? [],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Generate new access token + id_token
    const scopes = storedToken.scopes ?? [];
    const accessToken = generateOAuthAccessToken(
      user.id,
      client.clientId,
      scopes,
    );
    const idToken = generateIdToken(user, client.clientId, scopes);

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 600,
      refresh_token: newRefreshToken,
      id_token: idToken,
      scope: scopes.join(" "),
    };
  }
}

export const openIdService = new OpenIdService();
