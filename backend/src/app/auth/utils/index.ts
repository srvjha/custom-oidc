import { randomBytes, createHmac, createHash } from "node:crypto";
import JWT from "jsonwebtoken";
import type { StringValue } from "ms";
import { eq } from "drizzle-orm";
import ApiError from "../../../utils/api-error.js";
import { env } from "../../../utils/env-validate.js";
import { db } from "../../../db/index.js";
import {
  refreshTokensTable,
  usersTable,
  type Users,
} from "../../../db/schema.js";
import type { JWTClaims } from "./types.js";
import { PRIVATE_KEY, PUBLIC_KEY } from "../../openid/utils/certs.js";

interface UserPayload {
  id: string;
  email: string;
}

const hashPassword = (password: string, salt: string) => {
  if (salt.trim().length === 0) {
    salt = randomBytes(32).toString("hex");
  }
  const hashedPassword = createHmac("sha256", salt)
    .update(password)
    .digest("hex");
  return { salt, hashedPassword };
};

const hashToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

const verifyUserToken = (token: string) => {
  try {
    return JWT.verify(token, PUBLIC_KEY, {
      algorithms: ["RS256"],
      issuer: env.ISSUER,
    }) as UserPayload;
  } catch (error) {
    return null;
  }
};

const generateAccessToken = (user: Users) => {
  const claims: JWTClaims = {
    iss: env.ISSUER,
    sub: user.id,
    email: user.email,
    email_verified: user.emailVerified ? "true" : "false",
    exp: new Date().getTime() + 10 * 60 * 1000, // 10 minutes
    family_name: user.fullname.split(" ")[0] ?? "",
    given_name: user.fullname.split(" ")[1] ?? "",
    name: user.fullname,
  };

  return JWT.sign(claims, PRIVATE_KEY, {
    algorithm: "RS256",
  });
};

const generateRefreshToken = (id: string) => {
  const claims = {
    iss: env.ISSUER,
    sub: id,
    exp: new Date().getTime() + 1 * 24 * 60 * 60 * 1000, // 1 day
  };

  return JWT.sign(claims, PRIVATE_KEY, {
    algorithm: "RS256",
  });
};

const generateAccessAndRefreshToken = async (user: Users) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

  // add refreshtoken in db
  try {
    await db.insert(refreshTokensTable).values({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    });
  } catch (error: any) {
    throw new ApiError(500, error.message);
  }

  return { accessToken, refreshToken };
};

const revokeRefreshToken = async (refreshToken: string) => {
  try {
    await db
      .update(refreshTokensTable)
      .set({ revoked: true })
      .where(eq(refreshTokensTable.token, refreshToken));
  } catch (error: any) {
    throw new ApiError(500, error.message);
  }
};

const revokeAllRefreshTokens = async (userId: string) => {
  try {
    await db
      .update(refreshTokensTable)
      .set({ revoked: true })
      .where(eq(refreshTokensTable.userId, userId));
  } catch (error: any) {
    throw new ApiError(500, error.message);
  }
};

export {
  hashPassword,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  generateAccessAndRefreshToken,
  verifyUserToken,
  type UserPayload,
};
