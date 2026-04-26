import type { Request, Response } from "express";
import { handleOpenIdConfig } from "./services.js";

class OpenIdController {
  public async getOpenIdConfig(req: Request, res: Response) {
    const getWellknowConfig = await handleOpenIdConfig();
    return res.json(getWellknowConfig);
  }
}

export default OpenIdController;
