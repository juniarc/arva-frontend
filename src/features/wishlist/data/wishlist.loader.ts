import "server-only";
import { logServerError } from "@/lib/logger";
import { readWishlistOnBackend } from "../api/wishlist.server";
import { toWishlistData, WishlistMappingError } from "../mappers/wishlist.mapper";
import type { WishlistData } from "../types";

export type WishlistLoadResult = { status: "ok"; wishlist: WishlistData } | { status: "unauthorized" };

/** The wishlist could not be loaded for a reason other than "not logged in". */
export class WishlistLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WishlistLoadError";
  }
}

/** GET /wishlist with the user's token. Failures throw, so the route's error page shows. */
export async function loadWishlist(token: string): Promise<WishlistLoadResult> {
  const result = await readWishlistOnBackend(token);

  if (!result.ok) {
    if (result.status === 401) return { status: "unauthorized" };
    // readWishlistOnBackend has already logged the details.
    throw new WishlistLoadError("Could not load the wishlist.");
  }

  try {
    return { status: "ok", wishlist: toWishlistData(result.wishlist) };
  } catch (error) {
    logServerError("wishlist.unexpected_response", { endpoint: "/wishlist" });
    throw new WishlistMappingError(error instanceof Error ? error.message : "Unexpected wishlist item.");
  }
}
