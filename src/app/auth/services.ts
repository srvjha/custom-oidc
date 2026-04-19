import crypto from "node:crypto";
import { eq, and } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { db } from "../../db/index.js";
import { usersTable, refreshTokensTable } from "../../db/schema.js";
import { getPrivateKey, getPublicKey, getKid } from "../../config/keys.js";
import ApiError from "../../utils/api-error.js";

const ISSUER = process.env.ISSUER || "http://localhost:8000";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function generateSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
}

async function generateAccessAndIdTokens(user: {
  id: string;
  email: string;
  fullname: string;
  emailVerified: boolean;
}, nonce?: string) {
  const privateKey = getPrivateKey();
  const kid = getKid();

  const accessToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.fullname,
    token_type: "access",
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(ISSUER)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .sign(privateKey);

  const idTokenPayload: any = {
    sub: user.id,
    email: user.email,
    name: user.fullname,
    email_verified: user.emailVerified,
  };

  if (nonce) {
    idTokenPayload.nonce = nonce;
  }

  const idToken = await new SignJWT(idTokenPayload)
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(ISSUER)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(privateKey);

  return {
    access_token: accessToken,
    id_token: idToken,
    token_type: "Bearer" as const,
    expires_in: 900,
  };
}

async function generateRefreshToken(userId: string) {
  const privateKey = getPrivateKey();
  const kid = getKid();

  const refreshTokenId = crypto.randomUUID();
  const refreshToken = await new SignJWT({
    sub: userId,
    token_type: "refresh",
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(ISSUER)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuedAt()
    .setJti(refreshTokenId)
    .sign(privateKey);

  await db.insert(refreshTokensTable).values({
    id: refreshTokenId,
    userId: userId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
  });

  return {
    refresh_token: refreshToken,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  };
}

export async function signUp(data: {
  email: string;
  password: string;
  fullname: string;
  username?: string;
}) {
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, data.email))
    .limit(1);

  if (existing) {
    throw ApiError.conflict("User with this email already exists");
  }

  const salt = generateSalt();
  const hashedPassword = await hashPassword(data.password, salt);

  const insertValues: typeof usersTable.$inferInsert = {
    email: data.email,
    password: hashedPassword,
    salt,
    fullname: data.fullname,
  };
  if (data.username) {
    insertValues.username = data.username;
  }

  const [user] = await db.insert(usersTable).values(insertValues).returning({
    id: usersTable.id,
    email: usersTable.email,
    fullname: usersTable.fullname,
    emailVerified: usersTable.emailVerified,
  });

  if (!user) {
    throw ApiError.internal("Failed to create user");
  }

  const accessAndIdTokens = await generateAccessAndIdTokens(user);
  const refreshTokenData = await generateRefreshToken(user.id);

  return {
    user: { id: user.id, email: user.email, fullname: user.fullname },
    ...accessAndIdTokens,
    refreshToken: refreshTokenData.refresh_token,
    refreshTokenMaxAge: refreshTokenData.maxAge,
  };
}

export async function signIn(data: { email: string; password: string }) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, data.email))
    .limit(1);

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const hashedAttempt = await hashPassword(data.password, user.salt);
  if (hashedAttempt !== user.password) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const accessAndIdTokens = await generateAccessAndIdTokens({
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    emailVerified: user.emailVerified,
  });
  const refreshTokenData = await generateRefreshToken(user.id);

  return {
    user: { id: user.id, email: user.email, fullname: user.fullname },
    ...accessAndIdTokens,
    refreshToken: refreshTokenData.refresh_token,
    refreshTokenMaxAge: refreshTokenData.maxAge,
  };
}

export async function generateTokensForUser(userId: string, options: { scope?: string; nonce?: string } = {}) {
  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      fullname: usersTable.fullname,
      emailVerified: usersTable.emailVerified,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const accessAndIdTokens = await generateAccessAndIdTokens(user, options.nonce);
  const refreshTokenData = await generateRefreshToken(user.id);

  return {
    ...accessAndIdTokens,
    refreshToken: refreshTokenData.refresh_token,
    refreshTokenMaxAge: refreshTokenData.maxAge,
  };
}

export async function refreshAccessToken(token: string) {
  const publicKey = getPublicKey();

  let payload;
  try {
    const result = await jwtVerify(token, publicKey, {
      issuer: ISSUER,
      audience: ISSUER,
    });
    payload = result.payload;
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  if (payload.token_type !== "refresh") {
    throw ApiError.unauthorized("Invalid token type — expected a refresh token");
  }

  const [storedToken] = await db
    .select()
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.id, payload.jti!),
        eq(refreshTokensTable.revoked, false),
      ),
    )
    .limit(1);

  if (!storedToken) {
    throw ApiError.unauthorized("Refresh token revoked or does not exist");
  }

  await db
    .update(refreshTokensTable)
    .set({ revoked: true })
    .where(eq(refreshTokensTable.id, payload.jti!));

  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      fullname: usersTable.fullname,
      emailVerified: usersTable.emailVerified,
    })
    .from(usersTable)
    .where(eq(usersTable.id, payload.sub!))
    .limit(1);

  if (!user) {
    throw ApiError.unauthorized("User not found");
  }

  const accessAndIdTokens = await generateAccessAndIdTokens(user);
  const refreshTokenData = await generateRefreshToken(user.id);

  return {
    ...accessAndIdTokens,
    refreshToken: refreshTokenData.refresh_token,
    refreshTokenMaxAge: refreshTokenData.maxAge,
  };
}

export async function getUserInfo(userId: string) {
  const [user] = await db
    .select({
      sub: usersTable.id,
      name: usersTable.fullname,
      username: usersTable.username,
      email: usersTable.email,
      email_verified: usersTable.emailVerified,
      picture: usersTable.avatar,
      gender: usersTable.gender,
      created_at: usersTable.createdAt,
      updated_at: usersTable.updatedAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return user;
}
