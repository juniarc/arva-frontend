import {
  myShopResponseSchema,
  shippingChannelsResponseSchema,
  shopResponseSchema,
  type ShopResponseDto,
} from "../schemas/shop.schema";
import type { ShopEditRequest, ShopEditValues } from "../schemas/shop-edit.schema";
import { toNumericId, toRegionCode } from "../state/shop-regions";
import type { MyShop, ShippingChannel, Shop } from "../types";

/** The backend sent something the shop pages cannot use. */
export class ShopMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopMappingError";
  }
}

/** A logo is shown only from an http(s) URL or a path on our own site. */
function safeImageUrl(value: string | null | undefined): string | null {
  const url = value?.trim();
  if (!url) return null;
  return /^https?:\/\//i.test(url) || (url.startsWith("/") && !url.startsWith("//")) ? url : null;
}

export function toShop(dto: ShopResponseDto): Shop {
  return {
    slug: dto.slug,
    name: dto.name,
    city: dto.city,
    logoUrl: safeImageUrl(dto.logoUrl),
    description: dto.description?.trim() ?? "",
    operatingHours: dto.operatingHours,
    rating: dto.rating,
    productCount: dto.productCount,
    isOwner: dto.isOwner,
    // The owner's details are kept only for the owner, even if a response carried them for someone else.
    ownerDetails:
      dto.isOwner && dto.ownerDetails
        ? {
            contact: { email: dto.ownerDetails.contact.email, phone: dto.ownerDetails.contact.phone?.trim() || null },
            address: dto.ownerDetails.address ?? null,
            shippingChannels: dto.ownerDetails.shippingChannels,
          }
        : null,
  };
}

/** Throws ShopMappingError for a response without a name or slug, or with a bad shape. */
export function parseShop(data: unknown): Shop {
  const result = shopResponseSchema.safeParse(data);
  if (!result.success) throw new ShopMappingError("Unexpected shop response shape.");
  return toShop(result.data.shop);
}

/** The owner's own shop (GET and PUT /shops/me). */
export function parseMyShop(data: unknown): MyShop {
  const result = myShopResponseSchema.safeParse(data);
  if (!result.success) throw new ShopMappingError("Unexpected my-shop response shape.");
  const dto = result.data.shop;
  return {
    slug: dto.slug,
    name: dto.name,
    logoUrl: safeImageUrl(dto.logoUrl),
    description: dto.description?.trim() ?? "",
    operatingHours: dto.operatingHours,
    // The backend's numeric ids become the region lists' dotted codes, so the saved regions can be chosen.
    provinceId: toRegionCode("provinceId", dto.provinceId),
    cityId: toRegionCode("cityId", dto.cityId),
    districtId: toRegionCode("districtId", dto.districtId),
    subDistrictId: toRegionCode("subDistrictId", dto.subDistrictId),
    street: dto.street,
    zipCode: dto.zipCode ?? "",
    email: dto.email,
    phone: dto.phone?.trim() || null,
    shippingChannelIds: dto.shippingChannelIds,
  };
}

export function parseShippingChannels(data: unknown): ShippingChannel[] {
  const result = shippingChannelsResponseSchema.safeParse(data);
  if (!result.success) throw new ShopMappingError("Unexpected shipping channels response shape.");
  return result.data.items;
}

/** The form values for the edit form, from the owner's shop. */
export function toEditValues(shop: MyShop): ShopEditValues {
  return {
    name: shop.name,
    provinceId: shop.provinceId,
    cityId: shop.cityId,
    districtId: shop.districtId,
    subDistrictId: shop.subDistrictId,
    street: shop.street,
    shippingChannelIds: shop.shippingChannelIds,
    email: shop.email,
    phone: shop.phone ?? "",
    openingTime: shop.operatingHours.open,
    closingTime: shop.operatingHours.close,
  };
}

/** The body for PUT and POST /shops: trimmed, the email in lowercase, null for an empty phone, and numeric region ids. */
export function toEditRequest(values: ShopEditValues): ShopEditRequest {
  const phone = values.phone.trim();
  return {
    name: values.name.trim(),
    provinceId: toNumericId(values.provinceId),
    cityId: toNumericId(values.cityId),
    districtId: toNumericId(values.districtId),
    subDistrictId: toNumericId(values.subDistrictId),
    street: values.street.trim(),
    shippingChannelIds: values.shippingChannelIds,
    email: values.email.trim().toLowerCase(),
    phone: phone === "" ? null : phone,
    openingTime: values.openingTime,
    closingTime: values.closingTime,
  };
}
