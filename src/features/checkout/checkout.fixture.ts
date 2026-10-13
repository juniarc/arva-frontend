import { parseDraft } from "./mappers/checkout.mapper";
import type { Draft } from "./types";

/** Test helpers. `draftDto()` is shaped like the backend's answer (numeric ids); `makeDraft()` is the mapped result. */

export const addressDto = {
  label: "Home",
  province: { id: 1, name: "DKI Jakarta" },
  city: { id: 11, name: "Jakarta Pusat" },
  district: { id: 111, name: "Tanah Abang" },
  subDistrict: { id: 1111, name: "Kebon Melati" },
  street: "Jl. Jalan No.1",
  recipientName: "Agus",
  phone: "081234567890",
};

export function draftDto(overrides: Record<string, unknown> = {}) {
  return {
    items: [
      {
        id: 7,
        quantity: 2,
        product: {
          id: 3,
          slug: "banana",
          name: "Banana Fruit from Bali",
          imageUrl: "/images/dummy/placeholder.svg",
          shop: { slug: "kebun", name: "Kebun Bali" },
        },
        variant: { id: 9, label: "1 kg", unit: "kg", price: 2000, stock: 10 },
      },
    ],
    address: null,
    damageProtection: { enabled: false, fee: 2000 },
    shipping: null,
    voucher: null,
    paymentMethod: null,
    // These numbers are deliberately not the sum of each other: the page must show them as they are.
    summary: {
      productSubtotal: 4000,
      shippingSubtotal: 12000,
      buyerServiceFee: 500,
      handlingFee: 300,
      damageProtectionFee: 0,
      discount: 0,
      total: 10000,
    },
    ...overrides,
  };
}

export function makeDraft(overrides: Record<string, unknown> = {}): Draft {
  return parseDraft(draftDto(overrides));
}
