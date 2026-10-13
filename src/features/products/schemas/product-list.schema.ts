import { z } from "zod";
import { productSchema } from "./catalog.schema";

/**
 * GET /products. A list item has the shop either as flat `shopSlug` / `shopName` (what the backend
 * sends today) or as `shop: { slug, name }` (what the written contract says). Both are accepted,
 * and product-list.mapper.ts turns them into one shape.
 */
const listItemSchema = productSchema
  .omit({ shopSlug: true, shopName: true })
  .extend({
    shopSlug: z.string().optional(),
    shopName: z.string().optional(),
    shop: z.object({ slug: z.string(), name: z.string() }).optional(),
  });

export const productListPageSchema = z.object({
  products: z.array(listItemSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type ProductListItem = z.infer<typeof listItemSchema>;
export type Pagination = z.infer<typeof productListPageSchema>["pagination"];
