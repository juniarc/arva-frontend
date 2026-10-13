import { messageFromBody } from "@/lib/api/error-message";
import { requestJson } from "@/lib/api/http";
import { parseCart } from "../mappers/cart.mapper";
import type { CartData } from "../types";

/**
 * Browser-side cart API. Components call these functions and never use fetch directly.
 * They talk to our own Route Handlers, which add the token from the httpOnly cookie.
 */

export type CartResult = { ok: true; cart: CartData } | { ok: false; message: string };

const REQUEST_TIMEOUT_MS = 8_000;
const NETWORK_MESSAGE = "Unable to reach the server. Please try again.";
const UPDATE_FAILED = "Could not update the quantity. Please try again.";
const REMOVE_FAILED = "Could not remove the items. Please try again.";

async function send(
  method: "PATCH" | "DELETE",
  url: string,
  body: unknown,
  fallbackMessage: string,
): Promise<CartResult> {
  const result = await requestJson(url, { method, body, timeoutMs: REQUEST_TIMEOUT_MS });

  if (!result.ok) {
    if (result.reason === "network") return { ok: false, message: NETWORK_MESSAGE };
    return { ok: false, message: messageFromBody(result.body, fallbackMessage) };
  }

  try {
    return { ok: true, cart: parseCart(result.data) };
  } catch {
    return { ok: false, message: fallbackMessage };
  }
}

/** PATCH /api/cart/items/:id. Resolves with the full cart after the change. */
export function updateQuantity(itemId: string, quantity: number): Promise<CartResult> {
  return send("PATCH", `/api/cart/items/${encodeURIComponent(itemId)}`, { quantity }, UPDATE_FAILED);
}

/** DELETE /api/cart/items. Resolves with the full cart after the removal. */
export function removeItems(itemIds: string[]): Promise<CartResult> {
  return send("DELETE", "/api/cart/items", { itemIds }, REMOVE_FAILED);
}

export type BuyResult = { ok: false; message: string };

/** Stub: checkout is not built yet. The checkout feature replaces this with the real call. */
export async function buyNow(itemIds: string[]): Promise<BuyResult> {
  void itemIds;
  return { ok: false, message: "Checkout is coming soon." };
}
