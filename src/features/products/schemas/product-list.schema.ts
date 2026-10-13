import { z } from "zod";
import { productSchema } from "./catalog.schema";

/**
 * GET /products, and the product inside a wishlist item. The shop is either flat `shopSlug` /
 * `shopName` (what the backend sends today) or `shop: { slug, name }` (what the written contract
 * says). Both are accepted, and product-list.mapper.ts turns them into one shape.
 */
export const productListItemSchema = productSchema
  .omit({ shopSlug: true, shopName: true })
  .extend({
    shopSlug: z.string().optional(),
    shopName: z.string().optional(),
    shop: z.object({ slug: z.string(), name: z.string() }).optional(),
  });

export const productListPageSchema = z.object({
  products: z.array(productListItemSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type ProductListItem = z.infer<typeof productListItemSchema>;
export type Pagination = z.infer<typeof productListPageSchema>["pagination"];
