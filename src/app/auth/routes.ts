import { Router } from "express";
import * as authController from "./controllers.js";
import { authenticate } from "../../middleware/authenticate.js";

const authRouter: Router = Router();

// ── Public endpoints ──────────────────────────────────────────
authRouter.post("/register", authController.register);
authRouter.post("/token", authController.token);
authRouter.get("/certs", authController.certs);

// ── Protected endpoints ───────────────────────────────────────
authRouter.get("/userinfo", authenticate, authController.userinfo);

export { authRouter };
