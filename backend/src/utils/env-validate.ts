import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z.string().nonempty(),
  ISSUER: z.string().nonempty(),
  AUTHORIZE_URL: z.string().url().optional(),
  DEVELOPER_CONSOLE_URL: z.string().url(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    throw new Error(safeParseResult.error.message);
  }
  return safeParseResult.data;
}

export const env = createEnv(process.env);
