import { z } from "zod";
import type { AuthError, AuthErrorField } from "../types";

/** Every message the user can see for a failure. Raw errors are never shown. */
export const AUTH_MESSAGES = {
  network: "Unable to reach the server. Check your connection and try again.",
  server: "Something went wrong on our side. Please try again.",
  validation: "Please check your details and try again.",
  invalidCredentials: "Invalid username or password.",
  conflict: "That username or email is already taken.",
  emailTaken: "This email is already registered.",
  usernameTaken: "This username is already taken.",
} as const;

export const networkError: AuthError = { code: "network", message: AUTH_MESSAGES.network };
export const serverError: AuthError = { code: "server", message: AUTH_MESSAGES.server };
export const validationError: AuthError = {
  code: "validation",
  message: AUTH_MESSAGES.validation,
};

const MAX_BACKEND_MESSAGE_LENGTH = 200;

/** Reads `{ message }` from a backend error body, if it is a usable string. */
export function extractMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("message" in body)) return undefined;
  const { message } = body as { message: unknown };
  if (typeof message !== "string") return undefined;
  const trimmed = message.trim().slice(0, MAX_BACKEND_MESSAGE_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Works out which field a "taken" message is about. Returns undefined if unclear. */
function detectConflictField(message: string): AuthErrorField | undefined {
  const mentionsEmail = /e-?mail/i.test(message);
  const mentionsUsername = /user\s?name/i.test(message);
  if (mentionsEmail && !mentionsUsername) return "email";
  if (mentionsUsername && !mentionsEmail) return "username";
  return undefined;
}

export interface BackendFailure {
  reason: "network" | "http";
  status?: number;
  body?: unknown;
}

/** Turns a failed backend call into one of our user-facing errors. */
export function mapBackendFailure(flow: "login" | "register", failure: BackendFailure): AuthError {
  if (failure.reason === "network") return networkError;

  const message = extractMessage(failure.body);

  if (flow === "login" && failure.status === 401) {
    return { code: "invalid_credentials", message: message ?? AUTH_MESSAGES.invalidCredentials };
  }

  if (flow === "register" && failure.status === 409) {
    const field = message ? detectConflictField(message) : undefined;
    const fallback =
      field === "email"
        ? AUTH_MESSAGES.emailTaken
        : field === "username"
          ? AUTH_MESSAGES.usernameTaken
          : AUTH_MESSAGES.conflict;
    return { code: "conflict", message: message ?? fallback, field };
  }

  if (failure.status === 400 || failure.status === 422) return validationError;

  return serverError;
}

const authErrorSchema = z.object({
  code: z.enum(["invalid_credentials", "conflict", "validation", "network", "server"]),
  message: z.string(),
  field: z.enum(["username", "email", "password"]).optional(),
});

/** Reads the `{ error }` body our Route Handlers send. Falls back to a generic error. */
export function parseRouteError(body: unknown): AuthError {
  const result = z.object({ error: authErrorSchema }).safeParse(body);
  return result.success ? result.data.error : serverError;
}
