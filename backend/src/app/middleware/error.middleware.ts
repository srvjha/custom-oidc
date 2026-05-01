import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import ApiError from "../../utils/api-error.js";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  console.error(`[ErrorHandler] ${req.method} ${req.url} - Error:`, err.message);

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = "Validation Error";
    return res.status(statusCode).json({
      success: false,
      message,
      errors: err.issues.map((issue) => issue.message),
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorHandler;
