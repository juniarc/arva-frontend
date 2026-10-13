import type { Address, CheckoutItem, Draft, ShopGroup } from "../types";

/** Pure helpers for the checkout page. None of them calculate money: amounts come from `draft.summary`. */

export const MAX_QUANTITY = 99;

export function maxQuantity(item: CheckoutItem): number {
  return Math.min(item.stock, MAX_QUANTITY);
}

/** Groups items by shop, keeping the order in which each shop first appears. */
export function groupItemsByShop(items: readonly CheckoutItem[]): ShopGroup[] {
  const groups = new Map<string, ShopGroup>();
  for (const item of items) {
    const group = groups.get(item.shop.slug);
    if (group) group.items.push(item);
    else groups.set(item.shop.slug, { shop: item.shop, items: [item] });
  }
  return [...groups.values()];
}

/** "Jl. Jalan No.1, Sub-district, District, City, Province". */
export function formatAddress(address: Address): string {
  return [address.street, address.subDistrict.name, address.district.name, address.city.name, address.province.name].join(", ");
}

export type MissingStep = "address" | "shipping" | "payment";

const HINT_PHRASES: Record<MissingStep, string> = {
  address: "add your address",
  shipping: "choose a shipping option",
  payment: "choose a payment method",
};

/** What is still needed before the order can be placed. */
export function missingSteps(draft: Draft): MissingStep[] {
  const missing: MissingStep[] = [];
  if (!draft.address) missing.push("address");
  if (!draft.shipping) missing.push("shipping");
  if (!draft.paymentMethod) missing.push("payment");
  return missing;
}

export function canPlaceOrder(draft: Draft): boolean {
  return missingSteps(draft).length === 0;
}

/** "Add your address to continue." / "Add your address and choose a payment method to continue." */
export function payNowHint(draft: Draft): string | null {
  const phrases = missingSteps(draft).map((step) => HINT_PHRASES[step]);
  if (phrases.length === 0) return null;

  const list =
    phrases.length === 1 ? phrases[0] : `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
  return `${list?.charAt(0).toUpperCase()}${list?.slice(1)} to continue.`;
}
