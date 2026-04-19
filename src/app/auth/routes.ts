import { Router, type Request, type Response, type NextFunction } from "express";
import * as authController from "./controllers.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
  loginSchema,
  registerSchema,
  validateRequest,
} from "./validator.js";

const authRouter: Router = Router();

function validateTokenRequest(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (req.body.grant_type === "password") {
    try {
      req.body = loginSchema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
    return;
  }

  next();
}

// ── Public endpoints ──────────────────────────────────────────
authRouter.post(
  "/signup",
  validateRequest(registerSchema),
  authController.signup,
);
authRouter.post(
  "/signin",
  validateRequest(loginSchema),
  authController.signin,
);
authRouter.post("/token", validateTokenRequest, authController.token);
authRouter.get("/authorize", authController.authorize);
authRouter.get("/certs", authController.certs);

// ── Protected endpoints ───────────────────────────────────────
authRouter.get("/userinfo", authenticate, authController.userinfo);

export { authRouter };
