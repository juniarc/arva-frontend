import { describe, expect, it } from "vitest";
import { DUMMY_PRODUCTS } from "./dummy-products";

describe("DUMMY_PRODUCTS", () => {
  it("gives every product 1 to 4 variants", () => {
    for (const product of DUMMY_PRODUCTS) {
      expect(product.variants.length).toBeGreaterThanOrEqual(1);
      expect(product.variants.length).toBeLessThanOrEqual(4);
    }
  });

  it("uses unique variant labels within each product", () => {
    for (const product of DUMMY_PRODUCTS) {
      const labels = product.variants.map((variant) => variant.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it("keeps stock between 0 and 500 and prices between 1000 and 50000", () => {
    for (const variant of DUMMY_PRODUCTS.flatMap((product) => product.variants)) {
      expect(variant.stock).toBeGreaterThanOrEqual(0);
      expect(variant.stock).toBeLessThanOrEqual(500);
      expect(variant.price).toBeGreaterThanOrEqual(1000);
      expect(variant.price).toBeLessThanOrEqual(50000);
    }
  });

  it("uses the first variant's price as the card price", () => {
    for (const product of DUMMY_PRODUCTS) {
      expect(product.price).toBe(product.variants[0].price);
    }
  });

  it("matches the design's example product", () => {
    const banana = DUMMY_PRODUCTS.find((product) => product.slug === "balis-banana-fruit");

    expect(banana?.variants.map((variant) => variant.label)).toEqual(["500 ml", "1000 ml", "2000 ml", "5000 ml"]);
    expect(banana?.variants[0]).toMatchObject({ unit: "kg", stock: 250, price: 1000 });
  });
});
