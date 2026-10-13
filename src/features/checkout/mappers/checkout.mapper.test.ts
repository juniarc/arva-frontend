import { describe, expect, it } from "vitest";
import { addressDto, draftDto } from "../checkout.fixture";
import {
  CheckoutMappingError,
  parseDraft,
  parseOrder,
  parsePaymentMethods,
  parseRegions,
  parseShippingOptions,
  parseVouchers,
} from "./checkout.mapper";

describe("parseDraft", () => {
  it("maps the backend draft to the frontend type", () => {
    const draft = parseDraft(
      draftDto({
        address: addressDto,
        shipping: { id: 4, label: "JNE Reguler", estimate: "Estimated time arrival 2 days", price: 12000 },
        voucher: { id: 5, title: "10% Discount", code: "10PDISCOUNT", discountAmount: 12000 },
        paymentMethod: { id: 6, label: "Mandiri Virtual Account" },
        damageProtection: { enabled: true, fee: 2000 },
      }),
    );

    expect(draft.items[0]).toEqual({
      id: "7",
      quantity: 2,
      productId: "3",
      productSlug: "banana",
      name: "Banana Fruit from Bali",
      imageUrl: "/images/dummy/placeholder.svg",
      shop: { slug: "kebun", name: "Kebun Bali" },
      variantLabel: "1 kg",
      unit: "kg",
      price: 2000,
      stock: 10,
    });
    expect(draft.address?.province).toEqual({ id: "1", name: "DKI Jakarta" });
    expect(draft.shipping).toEqual({ id: "4", label: "JNE Reguler", estimate: "Estimated time arrival 2 days", price: 12000 });
    expect(draft.voucher).toEqual({ id: "5", title: "10% Discount", code: "10PDISCOUNT", discountAmount: 12000 });
    expect(draft.paymentMethod).toEqual({ id: "6", label: "Mandiri Virtual Account" });
    expect(draft.damageProtection).toEqual({ enabled: true, fee: 2000 });
  });

  it("keeps the summary exactly as the backend sent it", () => {
    expect(parseDraft(draftDto()).summary).toEqual({
      productSubtotal: 4000,
      shippingSubtotal: 12000,
      buyerServiceFee: 500,
      handlingFee: 300,
      damageProtectionFee: 0,
      discount: 0,
      total: 10000,
    });
  });

  it("accepts a draft with no address, shipping, voucher or payment method", () => {
    const draft = parseDraft(draftDto());
    expect(draft.address).toBeNull();
    expect(draft.shipping).toBeNull();
    expect(draft.voucher).toBeNull();
    expect(draft.paymentMethod).toBeNull();
  });

  it("rejects a draft with no summary", () => {
    const { summary: _summary, ...withoutSummary } = draftDto();
    expect(() => parseDraft(withoutSummary)).toThrow(CheckoutMappingError);
  });

  it("rejects a draft whose summary is missing the total", () => {
    const broken = draftDto();
    const { total: _total, ...summary } = broken.summary;
    expect(() => parseDraft({ ...broken, summary })).toThrow(CheckoutMappingError);
  });

  it("rejects an item with no shop", () => {
    const broken = draftDto();
    const item = broken.items[0]!;
    const { shop: _shop, ...product } = item.product;
    expect(() => parseDraft({ ...broken, items: [{ ...item, product }] })).toThrow(CheckoutMappingError);
  });

  it("rejects an address with a missing region", () => {
    const { subDistrict: _s, ...partial } = addressDto;
    expect(() => parseDraft(draftDto({ address: partial }))).toThrow(CheckoutMappingError);
  });

  it("rejects a body that is not a draft", () => {
    expect(() => parseDraft({ message: "Checkout session not found." })).toThrow(CheckoutMappingError);
  });
});

describe("the other mappers", () => {
  it("maps shipping options", () => {
    expect(parseShippingOptions({ options: [{ id: 1, label: "JNE", estimate: "2 days", price: 12000 }] })).toEqual([
      { id: "1", label: "JNE", estimate: "2 days", price: 12000 },
    ]);
  });

  it("maps vouchers, with an empty description for null", () => {
    expect(parseVouchers({ vouchers: [{ id: 2, title: "10%", description: null, code: "C", discountAmount: 5 }] })).toEqual([
      { id: "2", title: "10%", description: "", code: "C", discountAmount: 5 },
    ]);
  });

  it("maps payment methods with their availability", () => {
    expect(parsePaymentMethods({ methods: [{ id: 3, label: "Mandiri", available: false }] })).toEqual([
      { id: "3", label: "Mandiri", available: false },
    ]);
  });

  it("maps regions and the order", () => {
    expect(parseRegions({ items: [{ id: 1, name: "Bali" }] })).toEqual([{ id: "1", name: "Bali" }]);
    expect(parseOrder({ order: { id: 9, code: "ORD123" } })).toEqual({ id: "9", code: "ORD123" });
  });

  it("rejects wrong shapes", () => {
    expect(() => parseShippingOptions({})).toThrow(CheckoutMappingError);
    expect(() => parseOrder({ order: { id: 1 } })).toThrow(CheckoutMappingError);
  });
});
