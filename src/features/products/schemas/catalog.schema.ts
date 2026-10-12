import { z } from "zod";
import { formatTimeAgo } from "@/lib/format";

/**
 * Shapes returned by the catalog endpoints (see section 7 of CLAUDE.md).
 * They are parsed at runtime so we never trust the network blindly, and they turn
 * `null` into `undefined` so the rest of the app only deals with optional fields.
 * These schemas only run on the server, which is also where review dates become "1 week ago".
 */

const id = z.union([z.string(), z.number()]).transform(String);
const optionalNumber = z
  .number()
  .nullish()
  .transform((value) => value ?? undefined);
const optionalString = z
  .string()
  .nullish()
  .transform((value) => value || undefined);

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
  shopSlug: z.string(),
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

export const reviewSchema = z
  .object({
    id,
    authorName: z.string(),
    authorAvatarUrl: optionalString,
    rating: z.number(),
    text: z.string(),
    createdAt: z.string(),
  })
  .transform((review) => ({
    id: review.id,
    username: review.authorName,
    avatarUrl: review.authorAvatarUrl,
    rating: review.rating,
    createdAgo: formatTimeAgo(review.createdAt),
    text: review.text,
  }));

const shopSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    city: z.string(),
    logoUrl: optionalString,
    rating: z.object({ average: z.number(), ratingCount: z.number() }).nullish(),
  })
  .transform((shop) => ({
    slug: shop.slug,
    name: shop.name,
    city: shop.city,
    logoUrl: shop.logoUrl,
    rating: shop.rating?.average,
    ratingCount: shop.rating?.ratingCount,
  }));

const imageSchema = z.object({ id, url: z.string(), alt: z.string() });

export const productDetailSchema = z.object({
  id,
  slug: z.string(),
  name: z.string(),
  description: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  categorySlug: z.string(),
  categoryName: z.string(),
  soldCount: z.number(),
  rating: z.object({ average: z.number(), ratingCount: z.number(), reviewCount: z.number() }),
  images: z.array(imageSchema),
  variants: z.array(variantSchema).nonempty(),
  defaultVariantId: id,
  shop: shopSchema,
  reviewPreview: z.array(reviewSchema),
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
  linkUrl: optionalString,
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
export const reviewListResponseSchema = z.object({
  reviews: z.array(reviewSchema),
  pagination: z.object({ total: z.number() }),
});

export type Banner = z.infer<typeof bannerSchema>;
export type HomeResponse = z.infer<typeof homeResponseSchema>;
