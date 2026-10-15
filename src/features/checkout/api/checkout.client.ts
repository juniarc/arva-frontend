import { messageFromBody } from "@/lib/api/error-message";
import { requestJson } from "@/lib/api/http";
import {
  parseDraft,
  parseOrder,
  parsePaymentMethods,
  parseRegions,
  parseShippingOptions,
  parseVouchers,
  toAddressRequest,
} from "../mappers/checkout.mapper";
import type { AddressInput } from "../schemas/address.schema";
import type { Draft, Order, PaymentMethod, Region, ShippingOption, Voucher } from "../types";

/**
 * Browser-side checkout API. Components call these functions and never use fetch directly.
 * They talk to our own Route Handlers, which add the token from the httpOnly cookie.
 * A failure carries the HTTP status, so a screen can tell "not built yet" (404) from other problems.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; code?: string; message: string };

const TIMEOUT_MS = 8_000;
const NETWORK_MESSAGE = "Unable to reach the server. Please try again.";

async function call<T>(
  method: "GET" | "POST" | "PUT",
  url: string,
  body: unknown,
  parse: (data: unknown) => T,
  fallback: string,
): Promise<ApiResult<T>> {
  const result = await requestJson(url, { method, body, timeoutMs: TIMEOUT_MS });

  if (!result.ok) {
    if (result.reason === "network") return { ok: false, status: 0, message: NETWORK_MESSAGE };
    const code =
      typeof result.body === "object" && result.body !== null && "code" in result.body
        ? String((result.body as { code: unknown }).code)
        : undefined;
    // Only a 4xx message is meant for the user. A 5xx message may contain internal details, so it is never shown.
    const message = result.status >= 500 ? fallback : messageFromBody(result.body, fallback);
    return { ok: false, status: result.status, code, message };
  }

  try {
    return { ok: true, data: parse(result.data) };
  } catch {
    return { ok: false, status: 502, message: fallback };
  }
}

const DRAFT_FAILED = "Could not update your checkout. Please try again.";

/** POST /api/checkout: creates the draft from the selected cart items. */
export function createDraft(itemIds: string[]): Promise<ApiResult<Draft>> {
  return call("POST", "/api/checkout", { itemIds }, parseDraft, "Could not start checkout. Please try again.");
}

/** GET /api/checkout. */
export function getDraft(): Promise<ApiResult<Draft>> {
  return call("GET", "/api/checkout", undefined, parseDraft, DRAFT_FAILED);
}

/** PUT /api/checkout/address. Changes the draft's address only, never the profile. */
export function saveAddress(address: AddressInput): Promise<ApiResult<Draft>> {
  return call("PUT", "/api/checkout/address", toAddressRequest(address), parseDraft, "Could not save the address. Please try again.");
}

export function setDamageProtection(enabled: boolean): Promise<ApiResult<Draft>> {
  return call("PUT", "/api/checkout/damage-protection", { enabled }, parseDraft, "Could not update damage protection. Please try again.");
}

export function getShippingOptions(): Promise<ApiResult<ShippingOption[]>> {
  return call("GET", "/api/checkout/shipping-options", undefined, parseShippingOptions, "Could not load shipping options. Please try again.");
}

export function selectShipping(optionId: string): Promise<ApiResult<Draft>> {
  return call("PUT", "/api/checkout/shipping", { optionId }, parseDraft, "Could not select the shipping option. Please try again.");
}

export function getVouchers(): Promise<ApiResult<Voucher[]>> {
  return call("GET", "/api/checkout/vouchers", undefined, parseVouchers, "Could not load vouchers. Please try again.");
}

/** `null` removes the voucher. */
export function selectVoucher(voucherId: string | null): Promise<ApiResult<Draft>> {
  return call("PUT", "/api/checkout/voucher", { voucherId }, parseDraft, "Could not update the voucher. Please try again.");
}

export function getPaymentMethods(): Promise<ApiResult<PaymentMethod[]>> {
  return call("GET", "/api/checkout/payment-methods", undefined, parsePaymentMethods, "Could not load payment methods. Please try again.");
}

export function selectPaymentMethod(methodId: string): Promise<ApiResult<Draft>> {
  return call("PUT", "/api/checkout/payment-method", { methodId }, parseDraft, "Could not select the payment method. Please try again.");
}

/** POST /api/checkout/orders: places the order (the payment is simulated by the backend). */
export function placeOrder(): Promise<ApiResult<Order>> {
  return call("POST", "/api/checkout/orders", undefined, parseOrder, "Could not place your order. Please try again.");
}

const REGIONS_FAILED = "Could not load the address options. Please try again.";

export function getProvinces(): Promise<ApiResult<Region[]>> {
  return call("GET", "/api/regions/provinces", undefined, parseRegions, REGIONS_FAILED);
}

export function getCities(provinceId: string): Promise<ApiResult<Region[]>> {
  return call("GET", `/api/regions/provinces/${encodeURIComponent(provinceId)}/cities`, undefined, parseRegions, REGIONS_FAILED);
}

export function getDistricts(cityId: string): Promise<ApiResult<Region[]>> {
  return call("GET", `/api/regions/cities/${encodeURIComponent(cityId)}/districts`, undefined, parseRegions, REGIONS_FAILED);
}

export function getSubDistricts(districtId: string): Promise<ApiResult<Region[]>> {
  return call("GET", `/api/regions/districts/${encodeURIComponent(districtId)}/sub-districts`, undefined, parseRegions, REGIONS_FAILED);
}
