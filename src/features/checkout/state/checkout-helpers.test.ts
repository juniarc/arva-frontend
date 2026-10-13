import { describe, expect, it } from "vitest";
import { addressDto, makeDraft } from "../checkout.fixture";
import { canPlaceOrder, formatAddress, groupItemsByShop, maxQuantity, missingSteps, payNowHint } from "./checkout-helpers";

const shipping = { id: 4, label: "JNE Reguler", estimate: "2 days", price: 12000 };
const payment = { id: 6, label: "Mandiri Virtual Account" };

describe("Pay Now readiness", () => {
  it("is not ready when the address is missing, and the hint says so", () => {
    const draft = makeDraft({ shipping, paymentMethod: payment });

    expect(canPlaceOrder(draft)).toBe(false);
    expect(missingSteps(draft)).toEqual(["address"]);
    expect(payNowHint(draft)).toBe("Add your address to continue.");
  });

  it("is not ready when shipping is missing", () => {
    const draft = makeDraft({ address: addressDto, paymentMethod: payment });

    expect(canPlaceOrder(draft)).toBe(false);
    expect(payNowHint(draft)).toBe("Choose a shipping option to continue.");
  });

  it("is not ready when the payment method is missing", () => {
    const draft = makeDraft({ address: addressDto, shipping });

    expect(canPlaceOrder(draft)).toBe(false);
    expect(payNowHint(draft)).toBe("Choose a payment method to continue.");
  });

  it("names everything that is missing", () => {
    expect(payNowHint(makeDraft())).toBe("Add your address, choose a shipping option and choose a payment method to continue.");
    expect(payNowHint(makeDraft({ address: addressDto }))).toBe(
      "Choose a shipping option and choose a payment method to continue.",
    );
  });

  it("is ready, with no hint, when address, shipping and payment are all set", () => {
    const draft = makeDraft({ address: addressDto, shipping, paymentMethod: payment });

    expect(canPlaceOrder(draft)).toBe(true);
    expect(payNowHint(draft)).toBeNull();
  });
});

describe("formatAddress", () => {
  it("joins the street and the regions, smallest first", () => {
    const draft = makeDraft({ address: addressDto });
    expect(formatAddress(draft.address!)).toBe("Jl. Jalan No.1, Kebon Melati, Tanah Abang, Jakarta Pusat, DKI Jakarta");
  });
});

describe("groupItemsByShop", () => {
  it("groups items by shop slug in first-seen order", () => {
    const base = draftItem(1, "kebun");
    const groups = groupItemsByShop([base, draftItem(2, "tani"), draftItem(3, "kebun")]);

    expect(groups.map((group) => group.shop.slug)).toEqual(["kebun", "tani"]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(["1", "3"]);
  });
});

describe("maxQuantity", () => {
  it("is the stock, but never more than 99", () => {
    expect(maxQuantity({ ...draftItem(1, "k"), stock: 5 })).toBe(5);
    expect(maxQuantity({ ...draftItem(1, "k"), stock: 500 })).toBe(99);
  });
});

function draftItem(index: number, shopSlug: string) {
  const base = makeDraft().items[0]!;
  return { ...base, id: String(index), shop: { slug: shopSlug, name: shopSlug } };
}
