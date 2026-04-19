import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import type { Express, Request, Response, NextFunction } from "express";
import { authRouter } from "./auth/routes.js";
import { openidConfiguration } from "./auth/controllers.js";
import errorHandler from "../middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApplication(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 60 * 1000 // 30 minutes
    }
  }));

  // Enable CORS for all routes
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  // Serve static files from public folder
  const publicPath = path.join(__dirname, "../../public");
  app.use(express.static(publicPath));

  app.get("/.well-known/openid-configuration", openidConfiguration);

  app.get("/", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });

  app.get("/login", (req, res) => {
    // Check if user has an active session with auth request
    if (!(req.session as any).authRequest) {
      return res.redirect('/');
    }
    res.sendFile(path.join(publicPath, "login.html"));
  });

  app.get("/callback", (req, res) => {
    // Serve the callback page that will handle the token exchange on the client side
    res.sendFile(path.join(publicPath, "callback.html"));
  });

  app.get("/dashboard", (req, res) => {
    if (!(req.session as any).tokens) {
      return res.redirect('/');
    }
    res.sendFile(path.join(publicPath, "index.html"));
  });

  app.use("/auth", authRouter);

  app.use(errorHandler);

  return app;
}
