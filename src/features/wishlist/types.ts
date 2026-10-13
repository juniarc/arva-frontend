import type { Product } from "@/features/products/types";

/** One saved product. `id` belongs to the wishlist entry (it is what DELETE takes), not to the product. */
export interface WishlistItem {
  id: string;
  /** ISO 8601. */
  addedAt: string;
  product: Product;
  /** True when at least one variant is in stock. */
  isAvailable: boolean;
}

export interface WishlistData {
  /** Newest first, as the backend sends them. */
  items: WishlistItem[];
  itemCount: number;
}
