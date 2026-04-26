import { Router } from "express";
import OpenIdController from "./controllers.js";

const router: Router = Router();
const openIdController = new OpenIdController();

router.get(
  "/.well-known/openid-configuration",
  openIdController.getOpenIdConfig.bind(openIdController),
);
router.get("/auth/certs", openIdController.getJwks.bind(openIdController));
router.get("/o/authorize", openIdController.authorize.bind(openIdController));
export default router;
