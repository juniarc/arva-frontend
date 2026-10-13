import { messageFromBody } from "./error-message";

/**
 * Turns a backend error into the body a Route Handler sends to the browser.
 * A 4xx message is written for the user and is kept; a 5xx message may hold internal details, so it is replaced.
 * `errors` (a 400's field messages) and `field` (a 409's taken value) are kept only when they are short and well formed.
 */

const FIELD_NAME = /^[A-Za-z][A-Za-z0-9]{0,30}$/;
const MAX_FIELD_ERRORS = 12;
const MAX_MESSAGE_LENGTH = 200;

export function readFieldErrors(body: unknown): Record<string, string> | undefined {
  if (typeof body !== "object" || body === null || !("errors" in body)) return undefined;
  const { errors } = body;
  if (typeof errors !== "object" || errors === null) return undefined;

  const entries = Object.entries(errors)
    .filter((entry): entry is [string, string] => FIELD_NAME.test(entry[0]) && typeof entry[1] === "string" && entry[1].trim() !== "")
    .slice(0, MAX_FIELD_ERRORS)
    .map(([field, message]) => [field, message.trim().slice(0, MAX_MESSAGE_LENGTH)] as const);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function readField(body: unknown, allowed: readonly string[]): string | undefined {
  if (typeof body !== "object" || body === null || !("field" in body)) return undefined;
  return typeof body.field === "string" && allowed.includes(body.field) ? body.field : undefined;
}

export function proxyErrorBody(status: number, body: unknown, fallback: string, allowedFields: readonly string[]) {
  if (status >= 500) return { message: fallback };
  const errors = readFieldErrors(body);
  const field = readField(body, allowedFields);
  return { message: messageFromBody(body, fallback), ...(errors && { errors }), ...(field && { field }) };
}
