import { requestJson } from "@/lib/api/http";
import { parseWishlist } from "../mappers/wishlist.mapper";
import type { WishlistData } from "../types";

/**
 * Browser-side wishlist API. Components call these functions and never use fetch directly.
 * They talk to our own Route Handlers, which add the token from the httpOnly cookie.
 * Failure messages are fixed texts: what the server said is never shown to the user.
 */

export type WishlistResult = { ok: true; wishlist: WishlistData } | { ok: false; message: string };

const REQUEST_TIMEOUT_MS = 8_000;

/** The text for a failed removal comes from the design. */
export const REMOVE_FAILED_MESSAGE = "Wishlist Failed Removed. Please Try Again.";
const ADD_FAILED_MESSAGE = "Wishlist Failed Added. Please Try Again.";
const LOAD_FAILED_MESSAGE = "Could not load your wishlist. Please try again.";

async function send(
  method: "GET" | "POST" | "DELETE",
  url: string,
  body: unknown,
  failureMessage: string,
): Promise<WishlistResult> {
  const result = await requestJson(url, { method, body, timeoutMs: REQUEST_TIMEOUT_MS });
  if (!result.ok) return { ok: false, message: failureMessage };

  try {
    return { ok: true, wishlist: parseWishlist(result.data) };
  } catch {
    return { ok: false, message: failureMessage };
  }
}

/** GET /api/wishlist. */
export function getWishlist(): Promise<WishlistResult> {
  return send("GET", "/api/wishlist", undefined, LOAD_FAILED_MESSAGE);
}

/** POST /api/wishlist. Resolves with the full wishlist. Adding twice is fine. */
export function addToWishlist(productId: string): Promise<WishlistResult> {
  return send("POST", "/api/wishlist", { productId }, ADD_FAILED_MESSAGE);
}

/** DELETE /api/wishlist/items. `itemIds` are wishlist entry ids. Resolves with the full wishlist after removal. */
export function removeFromWishlist(itemIds: string[]): Promise<WishlistResult> {
  return send("DELETE", "/api/wishlist/items", { itemIds }, REMOVE_FAILED_MESSAGE);
}
