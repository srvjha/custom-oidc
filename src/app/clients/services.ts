import crypto from "node:crypto";
import { db } from "../../db/index.js";
import { clientsTable, usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export async function registerClient(data: {
  name: string;
  homepageUrl: string;
  redirectUris: string;
}) {
  // For this demo, we'll associate the app with the first user found in the DB.
  // In a real app, this would be the currently logged-in admin user.
  const [user] = await db.select().from(usersTable).limit(1);
  
  if (!user) {
    throw new Error("No users found in database. Please signup first.");
  }

  const clientId = crypto.randomBytes(16).toString("hex");
  const clientSecret = crypto.randomBytes(32).toString("hex");

  const [client] = await db.insert(clientsTable).values({
    name: data.name,
    homepageUrl: data.homepageUrl,
    redirectUris: data.redirectUris,
    clientId,
    clientSecret,
    userId: user.id,
  }).returning();

  if (!client) {
    throw new Error("Failed to register application");
  }

  return {
    client_id: client.clientId,
    client_secret: client.clientSecret,
    name: client.name,
    redirect_uris: client.redirectUris,
  };
}
