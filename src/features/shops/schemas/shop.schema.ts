import { z } from "zod";

/** The shapes the backend sends. Ids may arrive as numbers; they are kept as strings. */

const text = z.union([z.string(), z.number()]).transform(String);
const region = z.object({ id: text, name: z.string() });
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const channel = z.object({ id: text, name: z.string() });

const ownerDetails = z.object({
  contact: z.object({ email: z.string(), phone: z.string().nullish() }),
  address: z
    .object({
      street: z.string(),
      zipCode: text,
      province: region,
      city: region,
      district: region,
      subDistrict: region,
    })
    .nullish(),
  shippingChannels: z.array(channel),
});

/** GET /shops/:slug. A shop without a name or slug is rejected. */
export const shopResponseSchema = z.object({
  shop: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    city: z.string(),
    logoUrl: z.string().nullish(),
    description: z.string().nullish(),
    operatingHours: z.object({ open: hhmm, close: hhmm }),
    rating: z.object({ average: z.number(), ratingCount: z.number().int().min(0) }),
    productCount: z.number().int().min(0),
    // A response that does not say is treated as "not the owner".
    isOwner: z.boolean().default(false),
    ownerDetails: ownerDetails.nullish(),
  }),
});

const productItem = z.object({
  id: text,
  slug: z.string().min(1),
  name: z.string(),
  imageUrl: z.string(),
  categoryName: z.string(),
  price: z.number(),
  originalPrice: z.number().nullish(),
  discountPercent: z.number().nullish(),
  rating: z.number(),
  soldCount: z.number(),
  city: z.string(),
  shop: z.object({ slug: z.string(), name: z.string() }),
  manage: z
    .object({
      isActive: z.boolean(),
      totalStock: z.number(),
      variantLabels: z.array(z.string()),
      ratingCount: z.number(),
    })
    .nullish(),
});

/** GET /shops/:slug/products. */
export const shopProductsResponseSchema = z.object({
  products: z.array(productItem),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

/** GET and PUT /shops/me. */
export const myShopResponseSchema = z.object({
  shop: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    logoUrl: z.string().nullish(),
    description: z.string().nullish(),
    operatingHours: z.object({ open: hhmm, close: hhmm }),
    provinceId: text,
    cityId: text,
    districtId: text,
    subDistrictId: text,
    street: z.string(),
    zipCode: text.nullish(),
    email: z.string(),
    phone: z.string().nullish(),
    shippingChannelIds: z.array(text),
  }),
});

/** GET /shipping-channels. */
export const shippingChannelsResponseSchema = z.object({ items: z.array(channel) });

export type ShopResponseDto = z.infer<typeof shopResponseSchema>["shop"];
export type ShopProductItemDto = z.infer<typeof productItem>;
export type ShopProductsResponseDto = z.infer<typeof shopProductsResponseSchema>;
export type MyShopResponseDto = z.infer<typeof myShopResponseSchema>["shop"];
