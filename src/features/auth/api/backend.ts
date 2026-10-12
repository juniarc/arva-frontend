import "server-only";
import type { z } from "zod";
import { requestJson, type HttpResult } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import {
  loginResponseSchema,
  registerResponseSchema,
  type AuthUser,
  type LoginResponse,
} from "../schemas/auth-response.schema";
import type { LoginInput } from "../schemas/login.schema";
import type { AuthResult } from "../types";
import { mapBackendFailure, serverError } from "./errors";

/**
 * Server-only calls to the Express backend.
 * Used by the Route Handlers; the browser never talks to the backend directly.
 */

async function callBackend<S extends z.ZodTypeAny>(
  flow: "login" | "register",
  path: string,
  body: unknown,
  responseSchema: S,
): Promise<AuthResult<z.infer<S>>> {
  const result: HttpResult<unknown> = await requestJson(`${getEnv().API_BASE_URL}${path}`, {
    method: "POST",
    body,
  });

  if (result.ok) {
    const parsed = responseSchema.safeParse(result.data);
    if (parsed.success) return { ok: true, data: parsed.data };

    logServerError(`auth.${flow}.unexpected_response`, { endpoint: path, status: result.status });
    return { ok: false, error: serverError };
  }

  const error = mapBackendFailure(flow, result);

  // 401 and 409 are normal user mistakes; only log real problems.
  if (error.code === "network" || error.code === "server" || error.code === "validation") {
    logServerError(`auth.${flow}.backend_failed`, {
      endpoint: path,
      status: result.status,
      reason: result.reason,
    });
  }

  return { ok: false, error };
}

export function backendLogin(input: LoginInput): Promise<AuthResult<LoginResponse>> {
  return callBackend(
    "login",
    "/auth/login",
    { username: input.username, password: input.password },
    loginResponseSchema,
  );
}

export function backendRegister(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult<AuthUser>> {
  return callBackend(
    "register",
    "/auth/register",
    { username: input.username, email: input.email, password: input.password },
    registerResponseSchema,
  );
}
