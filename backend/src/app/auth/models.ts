import { z } from "zod";
import BaseDto from "../../dto/base.dto.js";

export class SignUpRequestDto extends BaseDto {
  static schema = z.object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters long" })
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      )
      .optional()
      .nullable(),
    email: z.string().email({ message: "Email is invalid" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    fullname: z
      .string()
      .min(3, { message: "Fullname must be at least 3 characters long" }),
    dateofbirth: z.string().min(8, { message: "Date of birth is required" }),
    gender: z.enum(["male", "female", "other"]),
  });
}

export class SignInRequestDto extends BaseDto {
  static schema = z.object({
    email: z.string().email({ message: "Email is invalid" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
  });
}

export type SignUpRequestModel = z.infer<typeof SignUpRequestDto.schema>;
export type SignInRequestModel = z.infer<typeof SignInRequestDto.schema>;
