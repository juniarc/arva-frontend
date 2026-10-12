import "server-only";
import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/**
 * Returns validated server-side configuration.
 * Validation runs on first use (not at import time) so `next build` does not
 * need the backend URL. The error lists variable names only, never values.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse({
    API_BASE_URL: process.env.API_BASE_URL,
  });

  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(`Invalid or missing environment variables: ${names.join(", ")}`);
  }

  cachedEnv = { API_BASE_URL: result.data.API_BASE_URL.replace(/\/+$/, "") };
  return cachedEnv;
}
