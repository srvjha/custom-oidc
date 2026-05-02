import type { Request, Response } from "express";
import { authService } from "./services.js";
import type { SignUpRequestModel } from "./models.js";
import ApiResponse from "../../utils/api-response.js";
import ApiError from "../../utils/api-error.js";

class AuthController {
  async signUp(req: Request, res: Response) {
    const user: SignUpRequestModel = req.body;
    const newUser = await authService.handleSignUp(user);
    if (!newUser) {
      throw new ApiError(400, "Failed to create user");
    }
    ApiResponse.created({
      res,
      message: "User created successfully",
      data: newUser,
    });
  }

  async signIn(req: Request, res: Response) {
    const data = req.body;
    const user = await authService.handleSignIn(data);
    if (!user) {
      throw new ApiError(400, "Failed to sign in");
    }
    const { accessToken, refreshToken } = user;
   
    res.cookie("refreshtoken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    ApiResponse.ok({
      res,
      message: "User signed in successfully",
      data: { accessToken, refreshToken },
    });
  }

  async signOut(req: Request, res: Response) {
    res.clearCookie("accesstoken");
    res.clearCookie("refreshtoken");
    ApiResponse.ok({
      res,
      message: "User signed out successfully",
    });
  }

  async me(req: Request, res: Response) {
    const { email } = req.user as { email: string };
    const user = await authService.handleMe(email);
    ApiResponse.ok({
      res,
      message: "User fetched successfully",
      data: user,
    });
  }

  async refreshToken(req: Request, res: Response) {
    const incomingRefreshToken = req.cookies?.refreshtoken;
    if (!incomingRefreshToken) {
      throw ApiError.unauthorized("Refresh token is required");
    }

    const { accessToken, refreshToken } = await authService.refreshTokens(incomingRefreshToken);

    res.cookie("refreshtoken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ApiResponse.ok({
      res,
      message: "Token refreshed successfully",
      data: { accessToken, refreshToken },
    });
  }
}

export default AuthController;
