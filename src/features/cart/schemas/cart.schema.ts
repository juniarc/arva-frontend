import { z } from "zod";

const id = z.union([z.string(), z.number()]).transform(String);

/** GET /cart and the body of a successful POST /cart. */
export const cartSchema = z.object({
  items: z.array(
    z.object({
      id,
      quantity: z.number(),
      product: z.object({
        id,
        slug: z.string(),
        name: z.string(),
        imageUrl: z.string(),
        shopName: z.string(),
      }),
      variant: z.object({
        id,
        label: z.string(),
        unit: z.string(),
        price: z.number(),
        stock: z.number(),
      }),
    }),
  ),
  itemCount: z.number(),
  subtotal: z.number(),
});

/** Body our own POST /api/cart accepts. The backend checks it again. */
export const addToCartRequestSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export type Cart = z.infer<typeof cartSchema>;
export type AddToCartRequest = z.infer<typeof addToCartRequestSchema>;
