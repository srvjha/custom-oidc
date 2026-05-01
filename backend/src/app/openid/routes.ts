import { Router, type Request, type Response, type NextFunction } from "express";
import OpenIdController from "./controllers.js";
import { validate } from "../middleware/auth.middleware.js";
import { ConsentRequestDto, TokenRequestDto } from "./models.js";

const router: Router = Router();
const openIdController = new OpenIdController();

const extractClientCredentials = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Basic ")) {
    const b64auth = authHeader.split(" ")[1];
    if (b64auth) {
      const [client_id, client_secret] = Buffer.from(b64auth, "base64").toString().split(":");
      if (client_id && client_secret) {
        req.body.client_id = client_id;
        req.body.client_secret = client_secret;
      }
    }
  }
  next();
};

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
  extractClientCredentials,
  validate(TokenRequestDto),
  openIdController.token.bind(openIdController),
);

router.get(
  "/o/userinfo",
  openIdController.userinfo.bind(openIdController),
);

export default router;
