import { z } from "zod";

/**
 * Shapes returned by the catalog endpoints (see section 7 of CLAUDE.md).
 * They are parsed at runtime so we never trust the network blindly, and they turn
 * `null` into `undefined` so the rest of the app only deals with optional fields.
 */

const id = z.union([z.string(), z.number()]).transform(String);
const optionalNumber = z
  .number()
  .nullish()
  .transform((value) => value ?? undefined);

export const categorySchema = z.object({
  id,
  slug: z.string(),
  name: z.string(),
  iconKey: z.string(),
});

export const productSchema = z.object({
  id,
  slug: z.string(),
  name: z.string(),
  categorySlug: z.string(),
  categoryName: z.string(),
  price: z.number(),
  originalPrice: optionalNumber,
  discountPercent: optionalNumber,
  rating: z.number(),
  soldCount: z.number(),
  city: z.string(),
  imageUrl: z.string(),
  shopName: z.string(),
});

export const variantSchema = z.object({
  id,
  label: z.string(),
  unit: z.string(),
  price: z.number(),
  originalPrice: optionalNumber,
  stock: z.number(),
});

export const productDetailSchema = productSchema.extend({
  description: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  variants: z.array(variantSchema).nonempty(),
});

export const bannerSchema = z.object({
  id,
  title: z.string(),
  subtitle: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  buttonLabel: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  linkUrl: z
    .string()
    .nullish()
    .transform((value) => value || undefined),
  imageUrl: z.string(),
});

export const homeResponseSchema = z.object({
  banners: z.object({
    carousel: z.array(bannerSchema),
    promoStrips: z.array(bannerSchema),
    sideBanners: z.array(bannerSchema),
    verticalBanners: z.array(bannerSchema),
  }),
  sections: z.object({
    popular: z.array(productSchema),
    fruits: z.array(productSchema),
    equipments: z.array(productSchema),
  }),
});

export const productListResponseSchema = z.object({ products: z.array(productSchema) });
export const categoriesResponseSchema = z.object({ categories: z.array(categorySchema) });
export const productDetailResponseSchema = z.object({ product: productDetailSchema });

export type Banner = z.infer<typeof bannerSchema>;
export type HomeResponse = z.infer<typeof homeResponseSchema>;
