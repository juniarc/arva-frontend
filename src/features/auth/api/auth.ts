import { requestJson } from "@/lib/api/http";
import type { LoginInput } from "../schemas/login.schema";
import type { SignupInput } from "../schemas/signup.schema";
import type { AuthResult, AuthSuccessBody } from "../types";
import { networkError, parseRouteError } from "./errors";

/**
 * Browser-side auth API. Components call these functions and never use fetch
 * directly. They talk to our own Route Handlers (same origin), which in turn
 * call the backend and manage the httpOnly cookie.
 */

async function post(path: string, body: unknown): Promise<AuthResult<AuthSuccessBody>> {
  const result = await requestJson<AuthSuccessBody>(path, { method: "POST", body });

  if (result.ok) return { ok: true, data: result.data };
  if (result.reason === "network") return { ok: false, error: networkError };
  return { ok: false, error: parseRouteError(result.body) };
}

export function login(input: LoginInput): Promise<AuthResult<AuthSuccessBody>> {
  return post("/api/auth/login", input);
}

export function register(input: SignupInput): Promise<AuthResult<AuthSuccessBody>> {
  return post("/api/auth/register", input);
}
