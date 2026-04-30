import type { Request, Response } from "express";
import JWT from "jsonwebtoken";
import { openIdService } from "./services.js";
import type {
  AuthorizeRequestModel,
  ConsentRequestModel,
  TokenRequestModel,
} from "./models.js";
import { PUBLIC_KEY } from "./utils/certs.js";
import { env } from "../../utils/env-validate.js";
import { verifyUserToken } from "../auth/utils/index.js";
import ApiError from "../../utils/api-error.js";
import { db } from "../../db/index.js";
import { usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";

class OpenIdController {
  public async getOpenIdConfig(req: Request, res: Response) {
    const config = await openIdService.handleOpenIdConfig();
    return res.json(config);
  }

  public async getJwks(req: Request, res: Response) {
    const key = await openIdService.handleJwks();
    return res.json({ keys: [key.toJSON()] });
  }

  /**
   * GET /o/authorize
   * Validates client, checks if user is logged in (via cookie), and either:
   * - Returns login_required (user not logged in)
   * - Returns consent_required (user hasn't consented)
   * - Redirects to redirect_uri with auth code (consent exists)
   */
  public async authorize(req: Request, res: Response) {
    const data = req.query as unknown as AuthorizeRequestModel;

    const requiredFields = [
      "client_id",
      "redirect_uri",
      "response_type",
      "scope",
    ] as const;
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      const errorUrl = new URL(
        "/error.html",
        `${req.protocol}://${req.get("host")}`,
      );
      errorUrl.searchParams.set("missing", missingFields.join(", "));
      if (data.client_id)
        errorUrl.searchParams.set("client_id", data.client_id);
      return res.redirect(errorUrl.toString());
    }

    // Check if user is logged in via cookie or Authorization header
    let userId: string | null = null;
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      const payload = verifyUserToken(token);
      if (payload) {
        const [user] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.email, payload.email));
        userId = user?.id || null;
      }
    }

    const result = await openIdService.handleAuthorize(data, userId);

    if (result.action === "login_required") {
      return res.status(401).json({
        error: "login_required",
        login_url: result.loginUrl,
        return_to: result.returnTo,
      });
    }

    if (result.action === "consent_required") {
      return res.status(200).json({
        action: "consent_required",
        client: result.client,
        scopes: result.scopes,
        client_id: result.client_id,
        redirect_uri: result.redirect_uri,
        state: result.state,
      });
    }

    // action === "redirect" — consent already granted
    return res.redirect(result.redirectUrl);
  }

  /**
   * POST /o/consent
   * User submits consent decision (approve/deny).
   * Must be authenticated.
   */
  public async consent(req: Request, res: Response) {
    const userId = await this.getUserIdFromRequest(req);
    const data: ConsentRequestModel = req.body;
    const result = await openIdService.handleConsent(data, userId);
    return res.json({ redirect_url: result.redirectUrl });
  }

  /**
   * POST /o/token
   * Token exchange endpoint.
   * Accepts: grant_type=authorization_code or grant_type=refresh_token.
   */
  public async token(req: Request, res: Response) {
    const data: TokenRequestModel = req.body;
    const result = await openIdService.handleTokenExchange(data);

    // OIDC token response must not be cached
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    return res.json(result);
  }

  /**
   * GET /o/userinfo
   * Returns user claims based on the access token's scopes.
   * Requires a valid OAuth access token with Bearer scheme.
   */
  public async userinfo(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Bearer token required");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw ApiError.unauthorized("Invalid token");
    }

    // Verify and decode the OAuth access token
    let payload: any;
    try {
      payload = JWT.verify(token, PUBLIC_KEY, {
        algorithms: ["RS256"],
        issuer: env.ISSUER,
      });
    } catch {
      throw ApiError.unauthorized("Invalid or expired access token");
    }

    if (!payload.sub || !payload.scope) {
      throw ApiError.unauthorized("Token missing required claims");
    }

    const scopes = (payload.scope as string).split(" ");
    const claims = await openIdService.handleUserInfo(payload.sub, scopes);
    return res.json(claims);
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private async getUserIdFromRequest(req: Request): Promise<string> {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw ApiError.unauthorized("No token provided");
    }

    const payload = verifyUserToken(token);
    if (!payload) {
      throw ApiError.unauthorized("Invalid token");
    }
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, payload.email));
    if (!user) {
      throw ApiError.unauthorized("User not found");
    }
    return user.id;
  }
}

export default OpenIdController;
