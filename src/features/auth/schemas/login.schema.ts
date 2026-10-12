import { z } from "zod";
import { usernameField } from "./fields";

export const loginSchema = z.object({
  username: usernameField,
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
