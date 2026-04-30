import { z } from "zod";
import BaseDto from "../../dto/base.dto.js";

export class CreateClientDto extends BaseDto {
  static schema = z.object({
    appName: z
      .string()
      .min(1, { message: "App name is required" })
      .max(50, { message: "App name must be at most 50 characters" }),
    websiteUrl: z.string().url({ message: "Invalid website URL" }),
    redirectUris: z
      .array(z.string().url({ message: "Invalid redirect URI" }))
      .min(1, { message: "At least one redirect URI is required" }),
  });
}

export type CreateClientModel = z.infer<typeof CreateClientDto.schema>;
