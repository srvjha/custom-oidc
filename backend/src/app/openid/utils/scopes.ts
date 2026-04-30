import type { Users } from "../../../db/schema.js";

export const SUPPORTED_SCOPES = ["openid", "profile", "email"] as const;

export function validateScopes(scopes: string[]): boolean {
  return scopes.every((s) =>
    (SUPPORTED_SCOPES as readonly string[]).includes(s),
  );
}

export function parseScopes(scopeString: string): string[] {
  return scopeString.split(" ").filter((s) => s.length > 0);
}

export function getClaimsForScopes(
  user: Users,
  scopes: string[],
): Record<string, unknown> {
  const claims: Record<string, unknown> = {};

  if (scopes.includes("openid")) {
    claims.sub = user.id;
  }

  if (scopes.includes("profile")) {
    claims.name = user.fullname;
    claims.given_name = user.fullname.split(" ")[0] ?? "";
    claims.family_name = user.fullname.split(" ").slice(1).join(" ") || "";
    claims.gender = user.gender;
    claims.birthdate = user.dateofbirth;
  }

  if (scopes.includes("email")) {
    claims.email = user.email;
    claims.email_verified = user.emailVerified;
  }

  return claims;
}
