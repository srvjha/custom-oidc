import { z } from "zod";
import BaseDto from "../../dto/base.dto.js";

export class AuthorizeRequestDto extends BaseDto {
  static schema = z.object({
    client_id: z.string().nonempty({ message: "client_id is required" }),
    response_type: z
      .string()
      .nonempty({ message: "response_type is required" }),
    redirect_uri: z
      .string()
      .nonempty({ message: "redirect_uri is required" })
      .url("Invalid redirect_uri"),
    scope: z.string().nonempty({ message: "scope is required" }),
    state: z.string().optional(),
  });
}

export type AuthorizeRequestModel = z.infer<typeof AuthorizeRequestDto.schema>;

export class ConsentRequestDto extends BaseDto {
  static schema = z.object({
    client_id: z.string().nonempty({ message: "client_id is required" }),
    redirect_uri: z.string().url({ message: "Invalid redirect_uri" }),
    scope: z.string().nonempty({ message: "scope is required" }),
    state: z.string().optional(),
    approved: z.boolean({ message: "approved is required" }),
  });
}

export type ConsentRequestModel = z.infer<typeof ConsentRequestDto.schema>;

export class TokenRequestDto extends BaseDto {
  static schema = z.object({
    grant_type: z.enum(["authorization_code", "refresh_token"], {
      message: "grant_type must be 'authorization_code' or 'refresh_token'",
    }),
    code: z.string().optional(),
    redirect_uri: z.string().optional(),
    client_id: z.string().nonempty({ message: "client_id is required" }),
    client_secret: z.string().nonempty({ message: "client_secret is required" }),
    refresh_token: z.string().optional(),
  });
}

export type TokenRequestModel = z.infer<typeof TokenRequestDto.schema>;
