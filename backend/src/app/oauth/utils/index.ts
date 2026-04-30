import { randomBytes, createHash } from "node:crypto";

export function generateClientCredentials() {
  const clientId = randomBytes(16).toString("hex");
  const clientSecret = randomBytes(32).toString("hex");
  const hashedSecret = hashSecret(clientSecret);
  return { clientId, clientSecret, hashedSecret };
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}
