import { Router } from "express";
import OpenIdController from "./controllers.js";

const router: Router = Router();
const openIdController = new OpenIdController();

router.get("/", openIdController.getOpenIdConfig.bind(openIdController));
export default router;
