import { z } from "zod";

/** Shapes returned by the checkout endpoints (see section 7 of CLAUDE.md). All ids may arrive as numbers. */

const id = z.union([z.string(), z.number()]).transform(String);
const region = z.object({ id, name: z.string() });

const addressDto = z.object({
  label: z.string(),
  province: region,
  city: region,
  district: region,
  subDistrict: region,
  street: z.string(),
  recipientName: z.string(),
  phone: z.string(),
});

const itemDto = z.object({
  id,
  quantity: z.number(),
  product: z.object({
    id,
    slug: z.string(),
    name: z.string(),
    imageUrl: z.string(),
    shop: z.object({ slug: z.string(), name: z.string() }),
  }),
  variant: z.object({
    id,
    label: z.string(),
    unit: z.string(),
    price: z.number(),
    stock: z.number(),
  }),
});

export const draftSchema = z.object({
  items: z.array(itemDto),
  address: addressDto.nullable(),
  damageProtection: z.object({ enabled: z.boolean(), fee: z.number() }),
  shipping: z.object({ id, label: z.string(), estimate: z.string(), price: z.number() }).nullable(),
  voucher: z.object({ id, title: z.string(), code: z.string(), discountAmount: z.number() }).nullable(),
  paymentMethod: z.object({ id, label: z.string() }).nullable(),
  summary: z.object({
    productSubtotal: z.number(),
    shippingSubtotal: z.number(),
    buyerServiceFee: z.number(),
    handlingFee: z.number(),
    damageProtectionFee: z.number(),
    discount: z.number(),
    total: z.number(),
  }),
});

export const shippingOptionsSchema = z.object({
  options: z.array(z.object({ id, label: z.string(), estimate: z.string(), price: z.number() })),
});

export const vouchersSchema = z.object({
  vouchers: z.array(
    z.object({
      id,
      title: z.string(),
      description: z.string().nullish().transform((value) => value ?? ""),
      code: z.string(),
      discountAmount: z.number(),
    }),
  ),
});

export const paymentMethodsSchema = z.object({
  methods: z.array(z.object({ id, label: z.string(), available: z.boolean() })),
});

export const regionsSchema = z.object({ items: z.array(region) });

export const orderResponseSchema = z.object({ order: z.object({ id, code: z.string() }) });

export type DraftDto = z.infer<typeof draftSchema>;

/** Bodies our own routes accept (besides the address, which has its own schema). */
const numericId = z.string().regex(/^\d+$/);
export const createDraftRequestSchema = z.object({ itemIds: z.array(numericId).min(1).max(100) }).strict();
export const damageProtectionRequestSchema = z.object({ enabled: z.boolean() }).strict();
export const shippingRequestSchema = z.object({ optionId: numericId }).strict();
export const voucherRequestSchema = z.object({ voucherId: numericId.nullable() }).strict();
export const paymentMethodRequestSchema = z.object({ methodId: numericId }).strict();
