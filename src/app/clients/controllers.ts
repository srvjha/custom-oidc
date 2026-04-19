import type { Request, Response, NextFunction } from "express";
import * as clientService from "./services.js";
import ApiResponse from "../../utils/api-response.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await clientService.registerClient(req.body);
    
    return ApiResponse.created({
      res,
      message: "Application registered successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
