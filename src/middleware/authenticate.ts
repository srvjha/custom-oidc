import type { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { getPublicKey } from "../config/keys.js";

const ISSUER = process.env.ISSUER || "http://localhost:8000";
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "unauthorized",
      error_description: "Missing or invalid Authorization header",
    });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const publicKey = getPublicKey();
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: ISSUER,
      audience: ISSUER,
    });

    if (payload.token_type !== "access") {
      res.status(401).json({
        error: "invalid_token",
        error_description: "Expected an access token",
      });
      return;
    }

    // Attach decoded claims to the request object
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({
      error: "invalid_token",
      error_description: "Token is invalid or expired",
    });
    return;
  }
}
