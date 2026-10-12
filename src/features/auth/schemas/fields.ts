import { z } from "zod";

/** Rules shared by the login and sign-up schemas. */
export const usernameField = z
  .string()
  .trim()
  .min(1, "Username is required")
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters");
