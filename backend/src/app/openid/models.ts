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
