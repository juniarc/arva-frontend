import "server-only";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { CheckoutMappingError, parseDraft } from "../mappers/checkout.mapper";
import type { Draft } from "../types";

const LOAD_TIMEOUT_MS = 8_000;

export type DraftLoadResult =
  | { status: "ok"; draft: Draft }
  /** 404: the user has no checkout draft (for example they opened /checkout directly). */
  | { status: "missing" }
  | { status: "unauthorized" };

/** The draft could not be loaded for a reason other than "missing" or "not logged in". */
export class CheckoutLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutLoadError";
  }
}

/** GET /checkout with the user's token. Other failures throw, so the route's error page shows. */
export async function loadDraft(token: string): Promise<DraftLoadResult> {
  const result = await requestJson(`${getEnv().API_BASE_URL}/checkout`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: LOAD_TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "http" && result.status === 401) return { status: "unauthorized" };
    if (result.reason === "http" && result.status === 404) return { status: "missing" };
    logServerError("checkout.load_failed", { endpoint: "/checkout", status: result.status, reason: result.reason });
    throw new CheckoutLoadError("Could not load the checkout.");
  }

  try {
    return { status: "ok", draft: parseDraft(result.data) };
  } catch (error) {
    if (error instanceof CheckoutMappingError) {
      logServerError("checkout.unexpected_response", { endpoint: "/checkout", status: result.status });
    }
    throw error;
  }
}
