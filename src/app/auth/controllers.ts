import type { Request, Response, NextFunction } from "express";
import * as authService from "./services.js";
import { getJWKS } from "../../config/keys.js";
import {
  registerSchema,
  loginSchema,
  validate,
} from "./validator.js";
import ApiResponse from "../../utils/api-response.js";
import ApiError from "../../utils/api-error.js";

interface User {
  email: string;
  password: string;
  fullname: string;
  username?: string;
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = validate(registerSchema, req.body);
    const result = await authService.signUp(data as User);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: result.refreshTokenMaxAge,
      path: "/",
    });

    return ApiResponse.created({
      res,
      message: "User registered successfully",
      data: {
        user: result.user,
        access_token: result.access_token,
        id_token: result.id_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function token(req: Request, res: Response, next: NextFunction) {
  try {
    const grantType: unknown = req.body.grant_type;

    if (grantType === "password") {
      const data = validate(loginSchema, {
        email: req.body.email ?? req.body.username,
        password: req.body.password,
      });
      const result = await authService.signIn(data);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: result.refreshTokenMaxAge,
        path: "/",
      });

      return res.json({
        user: result.user,
        access_token: result.access_token,
        id_token: result.id_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
      });
    }

    if (grantType === "refresh_token") {
      const refreshTokenFromCookie = req.cookies.refreshToken;
      if (!refreshTokenFromCookie) {
        throw ApiError.badRequest("Refresh token not found in cookies");
      }

      const tokens = await authService.refreshAccessToken(
        refreshTokenFromCookie,
      );
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: tokens.refreshTokenMaxAge,
        path: "/",
      });

      return res.json({
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
      });
    }

    throw ApiError.badRequest("Supported grant types: password, refresh_token");
  } catch (error) {
    next(error);
  }
}

export async function userinfo(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId: string | undefined = (req as any).user?.sub;
    if (!userId) {
      throw ApiError.unauthorized();
    }

    const info = await authService.getUserInfo(userId);
    return res.json(info);
  } catch (error) {
    next(error);
  }
}

export function certs(_req: Request, res: Response) {
  const jwks = getJWKS();
  res.setHeader("Cache-Control", "public, max-age=86400");
  return res.json(jwks);
}


export function openidConfiguration(req: Request, res: Response) {
  const issuer = process.env.ISSUER || `${req.protocol}://${req.get("host")}`;

  res.json({
    issuer,
    authorization_endpoint: `${issuer}/auth/token`,
    token_endpoint: `${issuer}/auth/token`,
    userinfo_endpoint: `${issuer}/auth/userinfo`,
    jwks_uri: `${issuer}/auth/certs`,
  });
}
