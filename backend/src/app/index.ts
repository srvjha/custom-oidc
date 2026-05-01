import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Express } from "express";
import errorHandler from "./middleware/error.middleware.js";
import healthRoutes from "./health/health.routes.js";
import openIdRoutes from "./openid/routes.js";
import authRoutes from "./auth/routes.js";
import oauthClientRoutes from "./oauth/routes.js";

export function createExpressApplication(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({ origin: "*" }));
  app.use(express.static("public"));

  app.use("/health", healthRoutes);
  app.use("/auth", authRoutes);
  app.use("/oauth/clients", oauthClientRoutes);
  app.use("/", openIdRoutes);

  app.use(errorHandler);

  return app;
}
