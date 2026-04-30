import JWT from "jsonwebtoken";
import { PRIVATE_KEY } from "./certs.js";
import { env } from "../../../utils/env-validate.js";
import type { Users } from "../../../db/schema.js";
import { getClaimsForScopes } from "./scopes.js";

// creating an OAuth access token (used to call protected APIs like /userinfo).
// Contains aud (client_id) and scope but no identity claims.

export function generateOAuthAccessToken(
  userId: string,
  clientId: string,
  scopes: string[],
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: env.ISSUER,
    sub: userId,
    aud: clientId,
    scope: scopes.join(" "),
    iat: now,
    exp: now + 10 * 60, // 10 minutes
  };
  return JWT.sign(payload, PRIVATE_KEY, { algorithm: "RS256" });
}

// creating an OIDC ID token (contains identity claims based on scopes).
// Sent to the client alongside the access token.

export function generateIdToken(
  user: Users,
  clientId: string,
  scopes: string[],
): string {
  const now = Math.floor(Date.now() / 1000);
  const claims = getClaimsForScopes(user, scopes);
  const payload = {
    iss: env.ISSUER,
    aud: clientId,
    iat: now,
    exp: now + 10 * 60, // 10 minutes
    ...claims,
  };
  return JWT.sign(payload, PRIVATE_KEY, { algorithm: "RS256" });
}
