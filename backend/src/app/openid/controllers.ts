import type { Request, Response } from "express";
import { handleJwks, handleOpenIdConfig } from "./services.js";

class OpenIdController {
  public async getOpenIdConfig(req: Request, res: Response) {
    const getWellknowConfig = await handleOpenIdConfig();
    return res.json(getWellknowConfig);
  }

  public async getJwks(req: Request, res: Response) {
    const key = await handleJwks();
    return res.json({ keys: [key.toJSON()] });
  }
}

export default OpenIdController;
