import "server-only";
import { messageFromBody } from "@/lib/api/error-message";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { wishlistSchema, type WishlistDto } from "../schemas/wishlist.schema";

/** Server-only calls to the wishlist endpoints. They need the user's token, so they never run in the browser. */

const TIMEOUT_MS = 8_000;

export type WishlistBackendResult =
  | { ok: true; wishlist: WishlistDto }
  | { ok: false; status: number; message: string };

async function callWishlist(
  token: string,
  method: "GET" | "POST" | "DELETE",
  path: string,
  logPath: string,
  body: unknown,
  fallbackMessage: string,
): Promise<WishlistBackendResult> {
  const result = await requestJson(`${getEnv().API_BASE_URL}${path}`, {
    method,
    body,
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "network") {
      return { ok: false, status: 503, message: "Unable to reach the server. Please try again." };
    }
    if (result.status === 401) return { ok: false, status: 401, message: "Please log in again." };

    // 404 is logged too: until the backend builds these endpoints, that is what every call returns.
    if (result.status >= 500 || result.status === 404) {
      logServerError("wishlist.request_failed", { endpoint: logPath, status: result.status, reason: result.reason });
    }
    return { ok: false, status: result.status, message: messageFromBody(result.body, fallbackMessage) };
  }

  const parsed = wishlistSchema.safeParse(result.data);
  if (!parsed.success) {
    logServerError("wishlist.unexpected_response", { endpoint: logPath, status: result.status });
    return { ok: false, status: 502, message: fallbackMessage };
  }
  return { ok: true, wishlist: parsed.data };
}

/** GET /wishlist. */
export function readWishlistOnBackend(token: string): Promise<WishlistBackendResult> {
  return callWishlist(token, "GET", "/wishlist", "/wishlist", undefined, "Could not load your wishlist.");
}

/** POST /wishlist. Idempotent: adding a product that is already saved is not an error. */
export function addToWishlistOnBackend(token: string, productId: string): Promise<WishlistBackendResult> {
  return callWishlist(token, "POST", "/wishlist", "/wishlist", { productId }, "Could not add to your wishlist.");
}

/** DELETE /wishlist/items. Removes wishlist entries by their ids. */
export function removeFromWishlistOnBackend(token: string, itemIds: string[]): Promise<WishlistBackendResult> {
  return callWishlist(token, "DELETE", "/wishlist/items", "/wishlist/items", { itemIds }, "Could not remove from your wishlist.");
}
