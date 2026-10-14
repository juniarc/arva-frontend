import "server-only";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { CheckoutMappingError, parseDraft, toAddressRequest } from "../mappers/checkout.mapper";
import type { Address, Draft } from "../types";

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

/**
 * PUT /checkout/address with the user's token, from the server (used to copy the profile address into a
 * new draft). Returns the updated draft, or null when it could not be saved: the page then asks the user.
 */
export async function saveDraftAddress(token: string, address: Address): Promise<Draft | null> {
  const result = await requestJson(`${getEnv().API_BASE_URL}/checkout/address`, {
    method: "PUT",
    body: toAddressRequest(address),
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: LOAD_TIMEOUT_MS,
  });

  if (!result.ok) {
    logServerError("checkout.prefill_failed", { endpoint: "/checkout/address", status: result.status, reason: result.reason });
    return null;
  }
  try {
    return parseDraft(result.data);
  } catch {
    logServerError("checkout.prefill_unexpected_response", { endpoint: "/checkout/address", status: result.status });
    return null;
  }
}
