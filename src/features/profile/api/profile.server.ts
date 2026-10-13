import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { messageFromBody } from "@/lib/api/error-message";
import { requestJson } from "@/lib/api/http";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { parseProfile, ProfileMappingError } from "../mappers/profile.mapper";
import { validatePhoto } from "../schemas/photo.schema";
import { profileAddressRequestSchema } from "../schemas/profile-address.schema";
import { profileInfoRequestSchema } from "../schemas/profile.schema";

/**
 * The browser never talks to the backend. It calls our own /api/profile routes, and this proxy adds the
 * token from the httpOnly cookie. Each route checks the request (before the backend sees anything)
 * and the answer goes through the profile mapper (before the browser sees it).
 */

const TIMEOUT_MS = 8_000;

const PHOTO_FIELD = "photo";

export type ProfileRouteKind = "info" | "address" | "photo";

const ROUTES: Record<ProfileRouteKind, { path: string; failureMessage: string; schema?: z.ZodTypeAny }> = {
  info: { path: "/profile", failureMessage: "Could not save your profile. Please try again.", schema: profileInfoRequestSchema },
  address: {
    path: "/profile/address",
    failureMessage: "Could not save your address. Please try again.",
    schema: profileAddressRequestSchema,
  },
  photo: { path: "/profile/photo", failureMessage: "Could not update your photo. Please try again." },
};

/** Statuses that mean something to the user. Anything else becomes a 502. */
const PASS_THROUGH_STATUSES = new Set([400, 401, 404, 409, 413, 415, 422, 429]);

const FIELD_NAME = /^[A-Za-z][A-Za-z0-9]{0,30}$/;
const MAX_FIELD_ERRORS = 10;
const MAX_MESSAGE_LENGTH = 200;

/** `errors` from a 400: `{ field: message }`. Anything that is not a short string pair is dropped. */
function readFieldErrors(body: unknown): Record<string, string> | undefined {
  if (typeof body !== "object" || body === null || !("errors" in body)) return undefined;
  const { errors } = body;
  if (typeof errors !== "object" || errors === null) return undefined;

  const entries = Object.entries(errors)
    .filter((entry): entry is [string, string] => FIELD_NAME.test(entry[0]) && typeof entry[1] === "string" && entry[1].trim() !== "")
    .slice(0, MAX_FIELD_ERRORS)
    .map(([field, message]) => [field, message.trim().slice(0, MAX_MESSAGE_LENGTH)] as const);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** `field` from a 409: which value is taken. Only these two are known. */
function readConflictField(body: unknown): "username" | "email" | undefined {
  if (typeof body !== "object" || body === null || !("field" in body)) return undefined;
  return body.field === "username" || body.field === "email" ? body.field : undefined;
}

/** Only a 4xx message is written for the user. A 5xx message may hold internal details, so it is replaced. */
function errorBody(status: number, body: unknown, fallback: string) {
  if (status >= 500) return { message: fallback };
  const errors = readFieldErrors(body);
  const field = readConflictField(body);
  return { message: messageFromBody(body, fallback), ...(errors && { errors }), ...(field && { field }) };
}

const BAD_PHOTO = { message: "Choose a JPG, PNG or WebP image up to 2 MB." };

/** The one file of the upload, or null when it is missing, the wrong type or too big. */
async function readPhoto(request: Request): Promise<File | null> {
  const form = await request.formData().catch(() => null);
  const file = form?.get(PHOTO_FIELD);
  if (!(file instanceof File)) return null;
  return validatePhoto(file) === null ? file : null;
}

/** The body for the backend, or null when the request is not acceptable. */
async function readBody(request: Request, schema: z.ZodTypeAny | undefined): Promise<{ body: unknown } | null> {
  if (schema) {
    const parsed = schema.safeParse(await request.json().catch(() => undefined));
    return parsed.success ? { body: parsed.data } : null;
  }
  const file = await readPhoto(request);
  if (!file) return null;
  // A new form with the one file: nothing else the browser sent goes on.
  const form = new FormData();
  form.append(PHOTO_FIELD, file, file.name);
  return { body: form };
}

export async function proxyProfile(request: Request, kind: ProfileRouteKind): Promise<NextResponse> {
  const route = ROUTES[kind];

  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: "Please log in again." }, { status: 401 });

  const accepted = await readBody(request, route.schema);
  if (!accepted) {
    const rejection = kind === "photo" ? BAD_PHOTO : { message: "Please check your details and try again." };
    return NextResponse.json(rejection, { status: 400 });
  }

  const result = await requestJson(`${getEnv().API_BASE_URL}${route.path}`, {
    method: "PUT",
    body: accepted.body,
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "network") {
      return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }
    // 404 is logged too: until the backend builds an endpoint, that is what it answers.
    if (result.status >= 500 || result.status === 404) {
      logServerError("profile.request_failed", { endpoint: route.path, status: result.status, reason: result.reason });
    }
    const status = PASS_THROUGH_STATUSES.has(result.status) ? result.status : 502;
    return NextResponse.json(errorBody(result.status, result.body, route.failureMessage), { status });
  }

  try {
    return NextResponse.json(parseProfile(result.data));
  } catch (error) {
    if (error instanceof ProfileMappingError) {
      logServerError("profile.unexpected_response", { endpoint: route.path, status: result.status });
      return NextResponse.json({ message: route.failureMessage }, { status: 502 });
    }
    throw error;
  }
}
