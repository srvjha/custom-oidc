import { Router } from "express";
import * as clientController from "./controllers.js";

const clientRouter: Router = Router();

clientRouter.post("/register", clientController.register);

export { clientRouter };
