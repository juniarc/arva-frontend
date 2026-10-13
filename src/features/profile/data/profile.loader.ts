import "server-only";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { parseProfile, ProfileMappingError } from "../mappers/profile.mapper";
import type { Profile } from "../types";

const LOAD_TIMEOUT_MS = 8_000;

export type ProfileLoadResult = { status: "ok"; profile: Profile } | { status: "unauthorized" };

/** The profile could not be loaded for a reason other than "not logged in" (404 included: not built yet). */
export class ProfileLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileLoadError";
  }
}

/** GET /profile with the user's token. Other failures throw, so the route's error page shows. */
export async function loadProfile(token: string): Promise<ProfileLoadResult> {
  const result = await requestJson(`${getEnv().API_BASE_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: LOAD_TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "http" && result.status === 401) return { status: "unauthorized" };
    logServerError("profile.load_failed", { endpoint: "/profile", status: result.status, reason: result.reason });
    throw new ProfileLoadError("Could not load the profile.");
  }

  try {
    return { status: "ok", profile: parseProfile(result.data) };
  } catch (error) {
    if (error instanceof ProfileMappingError) {
      logServerError("profile.unexpected_response", { endpoint: "/profile", status: result.status });
    }
    throw error;
  }
}
