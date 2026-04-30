import type { NextFunction, Request, Response } from "express";
import BaseDto from "../../dto/base.dto.js";
import ApiError from "../../utils/api-error.js";
import { verifyUserToken } from "../auth/utils/index.js";

type ValidationTarget = "body" | "query" | "params";

export function authMiddleware() {
  return function (req: Request, res: Response, next: NextFunction) {
    let token: string | undefined;

    const header = req.headers["authorization"];
      if (!header || !header.startsWith("Bearer ")) {
        throw ApiError.unauthorized("Invalid token format");
      }
      token = header.split(" ")[1];
    

    if (!token) return next();

    const payload = verifyUserToken(token);
    req.user = payload;
    next();
  };
}

export function restrictToAuthenticatedUser() {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      throw ApiError.unauthorized(
        "You are not authorized to access this resource",
      );
    }
    return next();
  };
}

export function validate(
  DtoClass: typeof BaseDto,
  target: ValidationTarget = "body",
) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const data = req[target];
      req[target] = await DtoClass.validate(data);
      next();
    } catch (error) {
      next(error);
    }
  };
}
