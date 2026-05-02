import type { Request, Response } from "express";
import { oauthClientService } from "./services.js";
import type { CreateClientModel } from "./models.js";
import ApiResponse from "../../utils/api-response.js";
import { db } from "../../db/index.js";
import { usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import ApiError from "../../utils/api-error.js";

class OAuthClientController {
  async create(req: Request, res: Response) {
    const data: CreateClientModel = req.body;
    const { id: userId } = req.user as { id: string };
    const client = await oauthClientService.createClient(data, userId);
    ApiResponse.created({
      res,
      message:
        "OAuth client created successfully. Save the client_secret — it won't be shown again.",
      data: client,
    });
  }

  async list(req: Request, res: Response) {
    const { id: userId } = req.user as { id: string };
    const clients = await oauthClientService.listClients(userId);
    ApiResponse.ok({
      res,
      message: "Clients retrieved successfully",
      data: clients,
    });
  }

  async get(req: Request, res: Response) {
    const id = req.params.id as string;
    const { id: ownerUserId } = req.user as { id: string };
    const client = await oauthClientService.getClient(id, ownerUserId);
    ApiResponse.ok({
      res,
      message: "Client retrieved successfully",
      data: client,
    });
  }

  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const { id: ownerUserId } = req.user as { id: string };
    await oauthClientService.deleteClient(id, ownerUserId);
    ApiResponse.ok({
      res,
      message: "Client deleted successfully",
    });
  }
}

export default OAuthClientController;
