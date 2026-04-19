import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
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

    if (grantType === "authorization_code") {
      const { code, code_verifier, redirect_uri } = req.body;

      if (!code) {
        throw ApiError.badRequest("Authorization code is required");
      }

      // Find the authorization code in session
      const codeData = (req.session as any).authCode;
      if (!codeData || codeData.code !== code) {
        throw ApiError.badRequest("Invalid authorization code");
      }

      // Check if code is expired
      if (Date.now() > codeData.expiresAt) {
        delete (req.session as any).authCode;
        throw ApiError.badRequest("Authorization code expired");
      }

      // Validate PKCE if present
      if (codeData.code_challenge) {
        if (!code_verifier) {
          throw ApiError.badRequest("Code verifier is required");
        }

        const expectedChallenge = crypto
          .createHash('sha256')
          .update(code_verifier)
          .digest('base64url');

        if (expectedChallenge !== codeData.code_challenge) {
          throw ApiError.badRequest("Invalid code verifier");
        }
      }

      // Validate redirect URI
      if (redirect_uri && redirect_uri !== codeData.redirect_uri) {
        throw ApiError.badRequest("Invalid redirect URI");
      }

      // Generate tokens for the user
      const tokens = await authService.generateTokensForUser(codeData.userId, {
        scope: codeData.scope,
        nonce: codeData.nonce,
      });

      // Clear the used authorization code
      delete (req.session as any).authCode;

      // Set refresh token cookie
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

    throw ApiError.badRequest("Supported grant types: password, authorization_code, refresh_token");
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

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if there's an active authorization request
    if (!(req.session as any).authRequest) {
      throw ApiError.badRequest('No active authorization request');
    }

    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    // Authenticate user
    const result = await authService.signIn({ email, password });

    // Generate authorization code
    const authRequest = (req.session as any).authRequest;
    const code = crypto.randomBytes(32).toString('hex');

    // Store authorization code with associated data
    // In production, use a proper store with expiration
    const codeData = {
      code,
      userId: result.user.id,
      client_id: authRequest.client_id,
      redirect_uri: authRequest.redirect_uri,
      scope: authRequest.scope,
      nonce: authRequest.nonce,
      code_challenge: authRequest.code_challenge,
      code_challenge_method: authRequest.code_challenge_method,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    // Store code (in production, use Redis or database)
    (req.session as any).authCode = codeData;

    // Clear the auth request from session
    delete (req.session as any).authRequest;

    // Redirect back to client with authorization code
    const redirectUri = new URL(authRequest.redirect_uri);
    redirectUri.searchParams.set('code', code);
    if (authRequest.state) {
      redirectUri.searchParams.set('state', authRequest.state);
    }

    res.json({ redirect_uri: redirectUri.toString() });

  } catch (error) {
    next(error);
  }
}

export function certs(_req: Request, res: Response) {
  const jwks = getJWKS();
  res.setHeader("Cache-Control", "public, max-age=86400");
  return res.json(jwks);
}

export async function authorize(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      response_type,
      client_id,
      redirect_uri,
      scope = 'openid',
      state,
      nonce,
      code_challenge,
      code_challenge_method = 'S256'
    } = req.query;

    // Validate required parameters
    if (!response_type || response_type !== 'code') {
      throw ApiError.badRequest('Invalid response_type. Only "code" is supported.');
    }

    if (!client_id) {
      throw ApiError.badRequest('client_id is required');
    }

    if (!redirect_uri) {
      throw ApiError.badRequest('redirect_uri is required');
    }

    // For simplicity, we'll accept any client_id and redirect_uri
    // In production, you'd validate these against registered clients

    // Store authorization request parameters in session
    const authRequest = {
      response_type,
      client_id,
      redirect_uri,
      scope,
      state,
      nonce,
      code_challenge,
      code_challenge_method,
      timestamp: Date.now()
    };

    (req.session as any).authRequest = authRequest;

    // Redirect to login page
    res.redirect('/login');

  } catch (error) {
    next(error);
  }
}

export function openidConfiguration(req: Request, res: Response) {
  const issuer = process.env.ISSUER || `${req.protocol}://${req.get("host")}`;

  res.json({
    issuer,
    authorization_endpoint: `${issuer}/auth/authorize`,
    token_endpoint: `${issuer}/auth/token`,
    userinfo_endpoint: `${issuer}/auth/userinfo`,
    jwks_uri: `${issuer}/auth/certs`,
  });
}
