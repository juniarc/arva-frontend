import { messageFromBody } from "@/lib/api/error-message";
import { requestJson } from "@/lib/api/http";
import { parseProfile } from "../mappers/profile.mapper";
import type { ProfileAddressRequest } from "../schemas/profile-address.schema";
import type { ProfileInfoRequest } from "../schemas/profile.schema";
import type { Profile } from "../types";

/**
 * Browser-side profile API. Components call these functions and never use fetch directly.
 * They talk to our own Route Handlers, which add the token from the httpOnly cookie.
 * A failure carries the HTTP status, plus the field messages of a 400 or the `field` of a 409.
 */

export type ProfileApiResult =
  | { ok: true; data: Profile }
  | { ok: false; status: number; message: string; field?: string; errors?: Record<string, string> };

const TIMEOUT_MS = 8_000;
const NETWORK_MESSAGE = "Unable to reach the server. Please try again.";

function readErrors(body: unknown): Record<string, string> | undefined {
  if (typeof body !== "object" || body === null || !("errors" in body)) return undefined;
  const { errors } = body;
  if (typeof errors !== "object" || errors === null) return undefined;
  const entries = Object.entries(errors).filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function readField(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("field" in body)) return undefined;
  return typeof body.field === "string" ? body.field : undefined;
}

async function save(url: string, body: unknown, fallback: string): Promise<ProfileApiResult> {
  const result = await requestJson(url, { method: "PUT", body, timeoutMs: TIMEOUT_MS });

  if (!result.ok) {
    if (result.reason === "network") return { ok: false, status: 0, message: NETWORK_MESSAGE };
    // Only a 4xx message is meant for the user. A 5xx message may contain internal details, so it is never shown.
    const message = result.status >= 500 ? fallback : messageFromBody(result.body, fallback);
    return { ok: false, status: result.status, message, field: readField(result.body), errors: readErrors(result.body) };
  }

  try {
    return { ok: true, data: parseProfile(result.data) };
  } catch {
    return { ok: false, status: 502, message: fallback };
  }
}

/** PUT /api/profile: name, username, email and phone. */
export function updateProfile(request: ProfileInfoRequest): Promise<ProfileApiResult> {
  return save("/api/profile", request, "Could not save your profile. Please try again.");
}

/** PUT /api/profile/address. Changes the profile address only, never a checkout draft. */
export function updateAddress(request: ProfileAddressRequest): Promise<ProfileApiResult> {
  return save("/api/profile/address", request, "Could not save your address. Please try again.");
}

/** PUT /api/profile/photo: one image, sent as multipart. */
export function uploadPhoto(file: File): Promise<ProfileApiResult> {
  const form = new FormData();
  form.append("photo", file, file.name);
  return save("/api/profile/photo", form, "Could not update your photo. Please try again.");
}
