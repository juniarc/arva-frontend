import { describe, expect, it } from "vitest";
import { parseWishlist, WishlistMappingError } from "./wishlist.mapper";

function dtoItem(overrides: Record<string, unknown> = {}, productOverrides: Record<string, unknown> = {}) {
  return {
    id: 12,
    addedAt: "2026-10-01T10:00:00.000Z",
    product: {
      id: 5,
      slug: "tomato-seeds",
      name: "Tomato Seeds",
      categorySlug: "seeds",
      categoryName: "Seeds",
      price: 15000,
      originalPrice: 20000,
      discountPercent: 25,
      rating: 4.7,
      soldCount: 640,
      city: "Kab. Bogor",
      imageUrl: "https://example.com/t.jpg",
      shop: { slug: "tani-makmur", name: "Tani Makmur" },
      isAvailable: true,
      ...productOverrides,
    },
    ...overrides,
  };
}

describe("parseWishlist", () => {
  it("maps the backend item to the frontend type", () => {
    const wishlist = parseWishlist({ items: [dtoItem()], itemCount: 1 });

    expect(wishlist.itemCount).toBe(1);
    expect(wishlist.items[0]).toEqual({
      id: "12",
      addedAt: "2026-10-01T10:00:00.000Z",
      isAvailable: true,
      product: {
        id: "5",
        slug: "tomato-seeds",
        name: "Tomato Seeds",
        categorySlug: "seeds",
        categoryName: "Seeds",
        price: 15000,
        originalPrice: 20000,
        discountPercent: 25,
        rating: 4.7,
        soldCount: 640,
        city: "Kab. Bogor",
        imageUrl: "https://example.com/t.jpg",
        shopSlug: "tani-makmur",
        shopName: "Tani Makmur",
      },
    });
  });

  it("keeps isAvailable false for a sold-out product", () => {
    const wishlist = parseWishlist({ items: [dtoItem({}, { isAvailable: false })], itemCount: 1 });
    expect(wishlist.items[0]?.isAvailable).toBe(false);
  });

  it("turns null discount fields into undefined", () => {
    const wishlist = parseWishlist({
      items: [dtoItem({}, { originalPrice: null, discountPercent: null })],
      itemCount: 1,
    });
    expect(wishlist.items[0]?.product.originalPrice).toBeUndefined();
    expect(wishlist.items[0]?.product.discountPercent).toBeUndefined();
  });

  it("keeps the order the backend sent", () => {
    const wishlist = parseWishlist({ items: [dtoItem({ id: 2 }), dtoItem({ id: 1 })], itemCount: 2 });
    expect(wishlist.items.map((item) => item.id)).toEqual(["2", "1"]);
  });

  it("accepts an empty wishlist", () => {
    expect(parseWishlist({ items: [], itemCount: 0 })).toEqual({ items: [], itemCount: 0 });
  });

  it("rejects an item with no product", () => {
    expect(() => parseWishlist({ items: [dtoItem({ product: undefined })], itemCount: 1 })).toThrow(WishlistMappingError);
  });

  it("rejects a product with no shop", () => {
    expect(() => parseWishlist({ items: [dtoItem({}, { shop: undefined })], itemCount: 1 })).toThrow(WishlistMappingError);
  });

  it("rejects a product without isAvailable", () => {
    expect(() => parseWishlist({ items: [dtoItem({}, { isAvailable: undefined })], itemCount: 1 })).toThrow(WishlistMappingError);
  });

  it("rejects a body that is not a wishlist", () => {
    expect(() => parseWishlist({ message: "Not found." })).toThrow(WishlistMappingError);
  });
});
