import type { NextFunction, Request, Response } from "express";
import BaseDto from "../../dto/base.dto.js";

type ValidationTarget = "body" | "query" | "params";

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
