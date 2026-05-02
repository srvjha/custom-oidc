import type { SignInRequestModel, SignUpRequestModel } from "./models.js";
import { db } from "../../db/index.js";
import { usersTable, refreshTokensTable } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import ApiError from "../../utils/api-error.js";
import {
  generateAccessAndRefreshToken,
  hashPassword,
  revokeAllRefreshTokens,
  revokeRefreshToken,
} from "./utils/index.js";
import JWT from "jsonwebtoken";
import { PUBLIC_KEY } from "../openid/utils/certs.js";

class AuthService {
  async handleSignUp(user: SignUpRequestModel) {
    const { email, password, fullname, dateofbirth, gender, username } = user;
    const emailAlreadyExists = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (emailAlreadyExists.length > 0) {
      throw ApiError.badRequest("Email already exists");
    }
    if (username) {
      const usernameExists = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, username));

      if (usernameExists.length > 0) {
        throw ApiError.badRequest("Username already exists");
      }
    }

    // hash password
    const { salt, hashedPassword } = hashPassword(password, "");

    // save user in db
    const [userId] = await db
      .insert(usersTable)
      .values({
        email,
        password: hashedPassword,
        fullname,
        dateofbirth,
        gender,
        username,
        salt,
      })
      .returning({ id: usersTable.id });

    return userId;
  }
  async handleSignIn(user: SignInRequestModel) {
    const { email, password } = user;
    const [userInfo] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (!userInfo) {
      throw ApiError.badRequest("User not found");
    }
    const { hashedPassword } = hashPassword(password, userInfo.salt);
    if (hashedPassword !== userInfo.password) {
      throw ApiError.badRequest("Invalid password");
    }
    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(userInfo);
    return { accessToken, refreshToken };
  }

  async handleSignOut(refreshToken: string) {
    if (refreshToken) {
      try {
        const decoded = JWT.verify(refreshToken, PUBLIC_KEY) as { sub: string };
        const userId = decoded.sub;
        await revokeAllRefreshTokens(userId);
      } catch (error) {
        // If token is invalid/expired, we still want to try revoking it specifically if possible
        await revokeRefreshToken(refreshToken);
      }
    }
  }

  async handleMe(email: string) {
    const [user] = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        fullname: usersTable.fullname,
        dateofbirth: usersTable.dateofbirth,
        gender: usersTable.gender,
        email: usersTable.email,
        emailVerified: usersTable.emailVerified,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (!user) {
      throw ApiError.badRequest("User not found");
    }
    return user;
  }

  async refreshTokens(incomingRefreshToken: string) {
    if (!incomingRefreshToken) {
      throw ApiError.unauthorized("Invalid or Expired Token");
    }

    let decoded: { sub: string };
    try {
      decoded = JWT.verify(incomingRefreshToken, PUBLIC_KEY) as { sub: string };
    } catch (error) {
      throw ApiError.badRequest("Invalid or expired refresh token");
    }

    const id = decoded.sub;

    // Check if refresh token exists in DB and is not revoked
    const rows = await db
      .select()
      .from(refreshTokensTable)
      .where(
        and(
          eq(refreshTokensTable.token, incomingRefreshToken),
          eq(refreshTokensTable.userId, id),
          eq(refreshTokensTable.revoked, false),
        ),
      );

    if (rows.length === 0) {
      // Refresh Token Reuse Detection
      // If a validly signed token is passed but it doesn't match the DB, it might be stolen.
      // Log the user out of all sessions immediately.
      await revokeAllRefreshTokens(id);
      throw ApiError.unauthorized(
        "Refresh token revoked or invalid. Logging out for security.",
      );
    }

    // Revoke the old token (rotation)
    await revokeRefreshToken(incomingRefreshToken);

    const [userInfo] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (!userInfo) {
      throw ApiError.unauthorized("User not found");
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(userInfo);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
