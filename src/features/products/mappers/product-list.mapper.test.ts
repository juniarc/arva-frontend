import { describe, expect, it } from "vitest";
import { parseProductList, ProductListMappingError } from "./product-list.mapper";

function item(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

const pagination = { page: 1, limit: 12, total: 1, totalPages: 1 };

describe("parseProductList", () => {
  it("maps a nested shop (the written contract)", () => {
    const { products } = parseProductList({
      products: [item({ shop: { slug: "tani-makmur", name: "Tani Makmur" } })],
      pagination,
    });

    expect(products[0]).toEqual({
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
    });
  });

  it("maps flat shopSlug and shopName (what the backend sends today)", () => {
    const { products } = parseProductList({
      products: [item({ shopSlug: "tani-makmur", shopName: "Tani Makmur" })],
      pagination,
    });
    expect(products[0]).toMatchObject({ shopSlug: "tani-makmur", shopName: "Tani Makmur" });
  });

  it("turns null discount fields into undefined", () => {
    const { products } = parseProductList({
      products: [item({ originalPrice: null, discountPercent: null, shopSlug: "s", shopName: "S" })],
      pagination,
    });
    expect(products[0]?.originalPrice).toBeUndefined();
    expect(products[0]?.discountPercent).toBeUndefined();
  });

  it("returns the pagination", () => {
    const result = parseProductList({ products: [], pagination: { page: 2, limit: 12, total: 17, totalPages: 2 } });
    expect(result.pagination).toEqual({ page: 2, limit: 12, total: 17, totalPages: 2 });
  });

  it("rejects an item with no shop", () => {
    expect(() => parseProductList({ products: [item()], pagination })).toThrow(ProductListMappingError);
  });

  it("rejects a body that is not a product list", () => {
    expect(() => parseProductList({ message: "nope" })).toThrow(ProductListMappingError);
  });
});
