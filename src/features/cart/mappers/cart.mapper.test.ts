import { describe, expect, it } from "vitest";
import { CartMappingError, parseCart } from "./cart.mapper";

function dto(productOverrides: Record<string, unknown> = {}) {
  return {
    items: [
      {
        id: 7,
        quantity: 2,
        product: {
          id: 3,
          slug: "banana-bali",
          name: "Banana",
          imageUrl: "https://example.com/banana.jpg",
          shop: { slug: "kebun-bali", name: "Kebun Bali" },
          ...productOverrides,
        },
        variant: { id: 9, label: "1 kg", unit: "kg", price: 2000, stock: 10 },
      },
    ],
    itemCount: 2,
    subtotal: 4000,
  };
}

describe("parseCart", () => {
  it("maps the backend response to cart items", () => {
    const cart = parseCart(dto());

    expect(cart.itemCount).toBe(2);
    expect(cart.subtotal).toBe(4000);
    expect(cart.items[0]).toEqual({
      id: "7",
      quantity: 2,
      productId: "3",
      productSlug: "banana-bali",
      name: "Banana",
      imageUrl: "https://example.com/banana.jpg",
      shop: { key: "kebun-bali", name: "Kebun Bali" },
      variantLabel: "1 kg",
      unit: "kg",
      price: 2000,
      stock: 10,
    });
  });

  it("rejects an item with no product.shop", () => {
    expect(() => parseCart(dto({ shop: undefined }))).toThrow(CartMappingError);
  });

  it("rejects an item whose product.shop is missing its slug", () => {
    expect(() => parseCart(dto({ shop: { name: "Kebun Bali" } }))).toThrow(CartMappingError);
  });

  it("rejects an item with no product", () => {
    const broken = dto();
    expect(() => parseCart({ ...broken, items: [{ ...broken.items[0], product: undefined }] })).toThrow(
      CartMappingError,
    );
  });

  it("rejects a body that is not a cart", () => {
    expect(() => parseCart({ message: "Please log in." })).toThrow(CartMappingError);
    expect(() => parseCart(undefined)).toThrow(CartMappingError);
  });
});
