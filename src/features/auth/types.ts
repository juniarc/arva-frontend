import type { AuthUser } from "./schemas/auth-response.schema";

export type { AuthUser };

/** The small set of failures the UI knows how to show. */
export type AuthErrorCode =
  | "invalid_credentials"
  | "conflict"
  | "validation"
  | "network"
  | "server";

/** Form fields a server error can be attached to. */
export type AuthErrorField = "username" | "email" | "password";

export interface AuthError {
  code: AuthErrorCode;
  /** Safe, user-facing text. */
  message: string;
  /** Set when the error belongs next to one specific field. */
  field?: AuthErrorField;
}

export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: AuthError };

/** Body returned by our own /api/auth/* Route Handlers on success. */
export interface AuthSuccessBody {
  user: AuthUser;
}
