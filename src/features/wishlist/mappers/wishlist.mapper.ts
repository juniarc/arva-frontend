import { toProduct } from "@/features/products/mappers/product-list.mapper";
import { wishlistSchema, type WishlistDto } from "../schemas/wishlist.schema";
import type { WishlistData } from "../types";

/** The backend sent a wishlist the page cannot use. */
export class WishlistMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WishlistMappingError";
  }
}

export function toWishlistData(dto: WishlistDto): WishlistData {
  return {
    items: dto.items.map((item) => ({
      id: item.id,
      addedAt: item.addedAt,
      // The product part has the same shape as a product list item, so it uses the same mapper.
      product: toProduct(item.product),
      isAvailable: item.product.isAvailable,
    })),
    itemCount: dto.itemCount,
  };
}

/** Validates an unknown response body and maps it. Throws WishlistMappingError when the shape is wrong. */
export function parseWishlist(data: unknown): WishlistData {
  const parsed = wishlistSchema.safeParse(data);
  if (!parsed.success) throw new WishlistMappingError("Unexpected wishlist response shape.");

  try {
    return toWishlistData(parsed.data);
  } catch (error) {
    // toProduct() throws for an item with no shop.
    throw new WishlistMappingError(error instanceof Error ? error.message : "Unexpected wishlist item.");
  }
}
