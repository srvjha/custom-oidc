import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Express } from "express";
import errorHandler from "../middleware/error.middleware.js";
import healthRoutes from "./health/health.routes.js";

export function createExpressApplication(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({ origin: "*" }));
  app.use(express.static("public"));

  app.use("/health", healthRoutes);

  app.use(errorHandler);

  return app;
}

