import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requestJson } from "@/lib/api/http";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { userSchema, type AuthUser } from "@/features/auth/schemas/auth-response.schema";

const VERIFY_TIMEOUT_MS = 8_000;

const meResponseSchema = z.object({ user: userSchema });

/** Sends the visitor to the login page and brings them back to `returnTo` afterwards. */
export function redirectToLogin(returnTo: string): never {
  redirect(`/login?redirect=${encodeURIComponent(returnTo)}`);
}

/**
 * For pages that need a signed-in user. Redirects guests (no cookie) and expired sessions
 * (the backend answers 401 on GET /auth/me). Any other failure throws, so the error page shows.
 * Returns the token so the page can load its own data from the backend.
 */
export async function requireUser(returnTo: string): Promise<{ token: string; user: AuthUser }> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) redirectToLogin(returnTo);

  const result = await requestJson(`${getEnv().API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: VERIFY_TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "http" && result.status === 401) redirectToLogin(returnTo);
    logServerError("auth.me_failed", { endpoint: "/auth/me", status: result.status, reason: result.reason });
    throw new Error("Could not verify your session.");
  }

  const parsed = meResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    logServerError("auth.me_unexpected_response", { endpoint: "/auth/me", status: result.status });
    throw new Error("Could not verify your session.");
  }
  return { token, user: parsed.data.user };
}
