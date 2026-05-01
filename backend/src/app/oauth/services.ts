import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { oauthClientsTable } from "../../db/schema.js";
import ApiError from "../../utils/api-error.js";
import { generateClientCredentials, hashSecret } from "./utils/index.js";
import type { CreateClientModel } from "./models.js";

class OAuthClientService {
  async createClient(data: CreateClientModel, ownerUserId: string) {
    const { clientId, clientSecret, hashedSecret } =
      generateClientCredentials();
      console.log({data,ownerUserId})

    const [client] = await db
      .insert(oauthClientsTable)
      .values({
        appName: data.appName,
        clientId,
        clientSecret: hashedSecret,
        websiteUrl: data.websiteUrl,
        redirectUris: data.redirectUris,
        ownerUserId,
      })
      .returning({
        id: oauthClientsTable.id,
        appName: oauthClientsTable.appName,
        clientId: oauthClientsTable.clientId,
        websiteUrl: oauthClientsTable.websiteUrl,
        redirectUris: oauthClientsTable.redirectUris,
        createdAt: oauthClientsTable.createdAt,
      });

    // Return the raw client secret only at creation time
    return { ...client, clientSecret };
  }

  async listClients(ownerUserId: string) {
    return db
      .select({
        id: oauthClientsTable.id,
        appName: oauthClientsTable.appName,
        clientId: oauthClientsTable.clientId,
        websiteUrl: oauthClientsTable.websiteUrl,
        redirectUris: oauthClientsTable.redirectUris,
        createdAt: oauthClientsTable.createdAt,
      })
      .from(oauthClientsTable)
      .where(eq(oauthClientsTable.ownerUserId, ownerUserId));
  }

  async getClient(id: string, ownerUserId: string) {
    const [client] = await db
      .select({
        id: oauthClientsTable.id,
        appName: oauthClientsTable.appName,
        clientId: oauthClientsTable.clientId,
        websiteUrl: oauthClientsTable.websiteUrl,
        redirectUris: oauthClientsTable.redirectUris,
        createdAt: oauthClientsTable.createdAt,
      })
      .from(oauthClientsTable)
      .where(
        and(
          eq(oauthClientsTable.id, id),
          eq(oauthClientsTable.ownerUserId, ownerUserId),
        ),
      );

    if (!client) {
      throw ApiError.notFound("Client not found");
    }
    return client;
  }

  async deleteClient(id: string, ownerUserId: string) {
    const [deleted] = await db
      .delete(oauthClientsTable)
      .where(
        and(
          eq(oauthClientsTable.id, id),
          eq(oauthClientsTable.ownerUserId, ownerUserId),
        ),
      )
      .returning({ id: oauthClientsTable.id });

    if (!deleted) {
      throw ApiError.notFound("Client not found");
    }
    return deleted;
  }

  async validateClient(clientId: string, clientSecret: string) {
    const [client] = await db
      .select()
      .from(oauthClientsTable)
      .where(eq(oauthClientsTable.clientId, clientId));

    if (!client) {
      throw ApiError.unauthorized("Invalid client_id");
    }

    const hashedInput = hashSecret(clientSecret);
    if (hashedInput !== client.clientSecret) {
      throw ApiError.unauthorized("Invalid client_secret");
    }

    return client;
  }
}

export const oauthClientService = new OAuthClientService();
