import type { Request, Response } from "express";

export async function healthCheck(req: Request, res: Response) {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
