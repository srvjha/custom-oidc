import { Router } from "express";
import AuthController from "./controllers.js";
import {
  authMiddleware,
  restrictToAuthenticatedUser,
  validate,
} from "../middleware/auth.middleware.js";
import { SignInRequestDto, SignUpRequestDto } from "./models.js";

const router: Router = Router();
const authController = new AuthController();

router.post(
  "/sign-up",
  validate(SignUpRequestDto),
  authController.signUp.bind(authController),
);
router.post(
  "/sign-in",
  validate(SignInRequestDto),
  authController.signIn.bind(authController),
);
router.post("/sign-out", authController.signOut.bind(authController));
router.get(
  "/me",
  authMiddleware(),
  restrictToAuthenticatedUser(),
  authController.me.bind(authController),
);

export default router;
