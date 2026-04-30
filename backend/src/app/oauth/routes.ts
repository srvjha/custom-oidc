import { Router } from "express";
import OAuthClientController from "./controllers.js";
import { CreateClientDto } from "./models.js";
import {
  authMiddleware,
  restrictToAuthenticatedUser,
  validate,
} from "../middleware/auth.middleware.js";

const router: Router = Router();
const controller = new OAuthClientController();

// All OAuth client routes require authentication
router.use(authMiddleware());
router.use(restrictToAuthenticatedUser());

router.post(
  "/",
  validate(CreateClientDto),
  controller.create.bind(controller),
);
router.get("/", controller.list.bind(controller));
router.get("/:id", controller.get.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

export default router;
