import type { Request, Response } from "express";
import { handleAuthorize, handleJwks, handleOpenIdConfig } from "./services.js";
import type { AuthorizeRequestModel } from "./models.js";

class OpenIdController {
  public async getOpenIdConfig(req: Request, res: Response) {
    const getWellknowConfig = await handleOpenIdConfig();
    return res.json(getWellknowConfig);
  }

  public async getJwks(req: Request, res: Response) {
    const key = await handleJwks();
    return res.json({ keys: [key.toJSON()] });
  }

  public async authorize(req: Request, res: Response) {
    const data = req.query as unknown as AuthorizeRequestModel;

    const requiredFields = ["client_id", "redirect_uri", "response_type", "scope"] as const;
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      const errorUrl = new URL("/error.html", `${req.protocol}://${req.get("host")}`);
      errorUrl.searchParams.set("missing", missingFields.join(", "));
      if (data.client_id) errorUrl.searchParams.set("client_id", data.client_id);
      return res.redirect(errorUrl.toString());
    }

    const getAuthUrl = await handleAuthorize(data);
    return res.redirect(getAuthUrl);
  }
}

export default OpenIdController;
