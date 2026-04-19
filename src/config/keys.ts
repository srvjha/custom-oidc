import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { exportJWK, importSPKI, importPKCS8 } from "jose";
import type { JWK, KeyObject } from "jose";

// ─── File Paths ───────────────────────────────────────────────
const KEYS_DIR = path.resolve(process.cwd(), "keys");
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, "private.pem");
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, "public.pem");

// ─── In-Memory Key References ─────────────────────────────────
let privateKey: KeyObject;
let publicKey: KeyObject;
let jwk: JWK;
let kid: string;

/**
 * Initializes the RSA key pair.
 * - If keys already exist on disk → load them.
 * - Otherwise → generate a fresh RSA-2048 pair and persist to `keys/`.
 *
 * Must be called once before the HTTP server starts.
 */
export async function initializeKeys(): Promise<void> {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  let privatePem: string;
  let publicPem: string;

  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    console.log("[keys] Loading existing RSA key pair from disk…");
    privatePem = fs.readFileSync(PRIVATE_KEY_PATH, "utf-8");
    publicPem = fs.readFileSync(PUBLIC_KEY_PATH, "utf-8");
  } else {
    console.log("[keys] Generating new RSA-2048 key pair…");
    const keyPair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    privatePem = keyPair.privateKey;
    publicPem = keyPair.publicKey;

    fs.writeFileSync(PRIVATE_KEY_PATH, privatePem, "utf-8");
    fs.writeFileSync(PUBLIC_KEY_PATH, publicPem, "utf-8");
    console.log("[keys] Key pair persisted to keys/");
  }

  // Import PEM → runtime KeyLike objects used by jose
  privateKey = await importPKCS8(privatePem, "RS256");
  publicKey = await importSPKI(publicPem, "RS256");

  // Deterministic Key ID derived from the public key fingerprint
  kid = crypto
    .createHash("sha256")
    .update(publicPem)
    .digest("hex")
    .slice(0, 16);

  // Build a JWK representation for the JWKS endpoint
  jwk = await exportJWK(publicKey);
  jwk.kid = kid;
  jwk.alg = "RS256";
  jwk.use = "sig";
  jwk.kty = "RSA";

  console.log(`[keys] Key ID (kid): ${kid}`);
}

export function getPrivateKey(): KeyObject {
  return privateKey;
}

export function getPublicKey(): KeyObject {
  return publicKey;
}

export function getKid(): string {
  return kid;
}

/** Returns the full JWKS document (array of public JWKs). */
export function getJWKS(): { keys: JWK[] } {
  return { keys: [jwk] };
}
