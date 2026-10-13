import { z } from "zod";
import { productListItemSchema } from "@/features/products/schemas/product-list.schema";

const id = z.union([z.string(), z.number()]).transform(String);

/** GET /wishlist, and the body of a successful POST /wishlist and DELETE /wishlist/items. */
export const wishlistSchema = z.object({
  items: z.array(
    z.object({
      id,
      addedAt: z.string(),
      product: productListItemSchema.extend({ isAvailable: z.boolean() }),
    }),
  ),
  itemCount: z.number(),
});

const numericId = z.string().regex(/^\d+$/);

/** Body our own POST /api/wishlist accepts. The backend checks it again. */
export const addToWishlistRequestSchema = z.object({ productId: numericId }).strict();

/** Body our own DELETE /api/wishlist/items accepts. */
export const removeFromWishlistRequestSchema = z
  .object({ itemIds: z.array(numericId).min(1).max(100) })
  .strict();

export type WishlistDto = z.infer<typeof wishlistSchema>;
