import { makeProduct } from "@/features/home/components/home.fixture";
import type { WishlistData, WishlistItem } from "./types";

/** Test helpers. Item `n` has the wishlist id `wn` and the product "Product n". */
export function makeWishlistItem(index: number, overrides: Partial<WishlistItem> = {}): WishlistItem {
  return {
    id: String(index),
    addedAt: "2026-10-01T10:00:00.000Z",
    product: makeProduct(index),
    isAvailable: true,
    ...overrides,
  };
}

export function makeWishlist(items: WishlistItem[]): WishlistData {
  return { items, itemCount: items.length };
}
