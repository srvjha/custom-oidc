import { Router } from "express";
import OpenIdController from "./controllers.js";
import { validate } from "../middleware/auth.middleware.js";
import { ConsentRequestDto, TokenRequestDto } from "./models.js";

const router: Router = Router();
const openIdController = new OpenIdController();

router.get(
  "/.well-known/openid-configuration",
  openIdController.getOpenIdConfig.bind(openIdController),
);

router.get("/auth/certs", openIdController.getJwks.bind(openIdController));

router.get("/o/authorize", openIdController.authorize.bind(openIdController));

router.post(
  "/o/consent",
  validate(ConsentRequestDto),
  openIdController.consent.bind(openIdController),
);

router.post(
  "/o/token",
  validate(TokenRequestDto),
  openIdController.token.bind(openIdController),
);

router.get("/o/userinfo", openIdController.userinfo.bind(openIdController));

export default router;
