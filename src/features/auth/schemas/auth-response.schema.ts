import { z } from "zod";

/** Shapes returned by the backend. Parsed at runtime so we never trust the network blindly. */
export const userSchema = z.object({
  user_id: z.union([z.string(), z.number()]),
  username: z.string(),
  email: z.string(),
});

export const loginResponseSchema = z.object({
  access_token: z.string().min(1),
  user: userSchema,
});

export const registerResponseSchema = userSchema;

export type AuthUser = z.infer<typeof userSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
