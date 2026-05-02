import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../utils/env-validate.js";

export const db = drizzle(env.DATABASE_URL);
