import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Express } from "express";
import { authRouter } from "./auth/routes.js";
import { clientRouter } from "./clients/routes.js";
import { openidConfiguration } from "./auth/controllers.js";
import errorHandler from "../middleware/error.middleware.js";

export function createExpressApplication(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({ origin: "*" }));
  app.use(express.static("public"));

  // OIDC Discovery endpoint
  app.get("/.well-known/openid-configuration", openidConfiguration);

  app.use("/auth", authRouter);
  app.use("/clients", clientRouter);

  app.use(errorHandler);

  return app;
}
