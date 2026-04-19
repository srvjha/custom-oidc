import type { Request, Response, NextFunction } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as authService from "./services.js";
import { getJWKS } from "../../config/keys.js";
import ApiResponse from "../../utils/api-response.js";
import ApiError from "../../utils/api-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  maxAge: number,
) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: maxAge,
    path: "/",
  });
}

export async function signup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await authService.signUp(req.body);
    setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenMaxAge);

    return ApiResponse.created({
      res,
      message: "User signed up successfully",
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

export async function signin(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signIn(req.body);
    setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenMaxAge);

    return ApiResponse.ok({
      res,
      message: "User signed in successfully",
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
      const data = req.body as { email: string; password: string };
      const result = await authService.signIn(data);

      setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenMaxAge);

      return res.json({
        user: result.user,
        access_token: result.access_token,
        id_token: result.id_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
      });
    }

    if (grantType === "authorization_code") {
      // Authorization code flow not supported in API-only mode
      throw ApiError.badRequest(
        "authorization_code grant type not supported in API-only mode",
      );
    }

    if (grantType === "refresh_token") {
      const refreshTokenFromCookie = req.cookies.refreshToken;
      if (!refreshTokenFromCookie) {
        throw ApiError.badRequest("Refresh token not found in cookies");
      }

      const tokens = await authService.refreshAccessToken(
        refreshTokenFromCookie,
      );
      setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenMaxAge);

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

export function authorize(req: Request, res: Response) {
  const { response_type, client_id, redirect_uri, scope } = req.query;

  // Basic check for OIDC parameters
  if (!response_type || !client_id || !redirect_uri) {
    // We still show the login page but the UI will show a warning
    // as per the user's request to "tell them access token because they didn't passed..."
    return res.sendFile(path.join(process.cwd(), "public/login.html"));
  }

  // If parameters are present, we just serve the file (in a real app, we'd validate the client_id here)
  return res.sendFile(path.join(process.cwd(), "public/login.html"));
}

export function openidConfiguration(req: Request, res: Response) {
  const issuer = process.env.ISSUER || `${req.protocol}://${req.get("host")}`;

  res.json({
    issuer,
    authorization_endpoint: `${issuer}/auth/authorize`,
    token_endpoint: `${issuer}/auth/token`,
    userinfo_endpoint: `${issuer}/auth/userinfo`,
    jwks_uri: `${issuer}/auth/certs`,
    grant_types_supported: ["password", "refresh_token", "authorization_code"],
    response_types_supported: ["code", "token", "id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: ["none"],
    claims_supported: ["sub", "name", "email", "email_verified"],
  });
}
