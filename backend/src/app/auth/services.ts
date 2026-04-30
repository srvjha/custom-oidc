import type { SignInRequestModel, SignUpRequestModel } from "./models.js";
import { db } from "../../db/index.js";
import { usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import ApiError from "../../utils/api-error.js";
import { generateAccessAndRefreshToken, hashPassword } from "./utils/index.js";

class AuthService {
  async handleSignUp(user: SignUpRequestModel) {
    const { email, password, fullname, dateofbirth, gender, username } = user;
    const emailAlreadyExists = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
      console.log({emailAlreadyExists})
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

  // logout is directly written controller

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
}

export const authService = new AuthService();
