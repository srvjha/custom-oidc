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
    const { email } = req.user as {email:string}
    // get user from db
    const [user] = await db.select({id:usersTable.id}).from(usersTable).where(eq(usersTable.email,email))
    if(!user) throw ApiError.notFound("User not found")
    const client = await oauthClientService.createClient(data, user.id);
    ApiResponse.created({
      res,
      message:
        "OAuth client created successfully. Save the client_secret — it won't be shown again.",
      data: client,
    });
  }

  async list(req: Request, res: Response) {
    const { id: ownerUserId } = req.user as { id: string };
    const clients = await oauthClientService.listClients(ownerUserId);
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
