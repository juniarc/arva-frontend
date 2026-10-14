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
import { toNumericId, toRegionCode, type RegionCodeLevel } from "@/lib/region-code";
import type { AddressInput, CheckoutAddressRequest } from "../schemas/address.schema";
import type { Address, Draft, Order, PaymentMethod, Region, ShippingOption, Voucher } from "../types";

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

/** The backend's numeric region id as the region lists' dotted code, so the saved region can be chosen again. */
const regionFromBackend = (level: RegionCodeLevel, region: Region): Region => ({ id: toRegionCode(level, region.id), name: region.name });

function toAddress(dto: NonNullable<DraftDto["address"]>): Address {
  return {
    ...dto,
    province: regionFromBackend("province", dto.province),
    city: regionFromBackend("city", dto.city),
    district: regionFromBackend("district", dto.district),
    subDistrict: regionFromBackend("subDistrict", dto.subDistrict),
  };
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
    address: dto.address ? toAddress(dto.address) : null,
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

/** The body for PUT /checkout/address: trimmed text, and region ids only, as numeric strings ("31.71" is "3171"). */
export function toAddressRequest(address: AddressInput): CheckoutAddressRequest {
  return {
    label: address.label.trim(),
    province: { id: toNumericId(address.province.id) },
    city: { id: toNumericId(address.city.id) },
    district: { id: toNumericId(address.district.id) },
    subDistrict: { id: toNumericId(address.subDistrict.id) },
    street: address.street.trim(),
    recipientName: address.recipientName.trim(),
    phone: address.phone,
  };
}
