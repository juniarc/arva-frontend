import type { z } from "zod";
import {
  draftSchema,
  orderResponseSchema,
  paymentMethodsSchema,
  regionsSchema,
  shippingOptionsSchema,
  vouchersSchema,
  type DraftDto,
} from "../schemas/checkout.schema";
import type { Draft, Order, PaymentMethod, Region, ShippingOption, Voucher } from "../types";

/** The backend sent something the checkout page cannot use. */
export class CheckoutMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutMappingError";
  }
}

function parse<S extends z.ZodTypeAny>(schema: S, data: unknown, what: string): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) throw new CheckoutMappingError(`Unexpected ${what} response shape.`);
  return result.data;
}

export function toDraft(dto: DraftDto): Draft {
  return {
    items: dto.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      productId: item.product.id,
      productSlug: item.product.slug,
      name: item.product.name,
      imageUrl: item.product.imageUrl,
      shop: item.product.shop,
      variantLabel: item.variant.label,
      unit: item.variant.unit,
      price: item.variant.price,
      stock: item.variant.stock,
    })),
    address: dto.address,
    damageProtection: dto.damageProtection,
    shipping: dto.shipping,
    voucher: dto.voucher,
    paymentMethod: dto.paymentMethod,
    summary: dto.summary,
  };
}

/** Throws CheckoutMappingError for a draft with a missing part (for example no summary). */
export function parseDraft(data: unknown): Draft {
  return toDraft(parse(draftSchema, data, "checkout draft"));
}

export function parseShippingOptions(data: unknown): ShippingOption[] {
  return parse(shippingOptionsSchema, data, "shipping options").options;
}

export function parseVouchers(data: unknown): Voucher[] {
  return parse(vouchersSchema, data, "vouchers").vouchers;
}

export function parsePaymentMethods(data: unknown): PaymentMethod[] {
  return parse(paymentMethodsSchema, data, "payment methods").methods;
}

export function parseRegions(data: unknown): Region[] {
  return parse(regionsSchema, data, "regions").items;
}

export function parseOrder(data: unknown): Order {
  return parse(orderResponseSchema, data, "order").order;
}
