import { describe, expect, it } from "vitest";
import { homeResponseSchema, productDetailResponseSchema } from "./catalog.schema";

const product = {
  id: 1,
  slug: "manggo",
  name: "Manggo",
  categorySlug: "fruits",
  categoryName: "Fruits",
  price: 2000,
  originalPrice: null,
  discountPercent: null,
  rating: 3.4,
  soldCount: 501,
  city: "Kab. Bandung",
  imageUrl: "/images/dummy/manggo.jpg",
  shopName: "Tani Makmur",
};

describe("catalog schemas", () => {
  it("turns null discount fields into undefined and ids into strings", () => {
    const parsed = productDetailResponseSchema.parse({
      product: {
        ...product,
        description: null,
        variants: [{ id: 7, label: "1 kg", unit: "kg", price: 2000, originalPrice: null, stock: 10 }],
      },
    });

    expect(parsed.product.id).toBe("1");
    expect(parsed.product.originalPrice).toBeUndefined();
    expect(parsed.product.description).toBe("");
    expect(parsed.product.variants[0]).toMatchObject({ id: "7", originalPrice: undefined });
  });

  it("rejects a product with no variants", () => {
    const result = productDetailResponseSchema.safeParse({ product: { ...product, description: "", variants: [] } });

    expect(result.success).toBe(false);
  });

  it("parses the home response", () => {
    const banner = {
      id: 1,
      title: "BIG SALE",
      subtitle: null,
      buttonLabel: "Shop now",
      linkUrl: "/products",
      imageUrl: "/a.jpg",
    };
    const parsed = homeResponseSchema.parse({
      banners: { carousel: [banner], promoStrips: [], sideBanners: [], verticalBanners: [] },
      sections: { popular: [product], fruits: [], equipments: [] },
    });

    expect(parsed.banners.carousel[0]).toMatchObject({ id: "1", subtitle: "" });
    expect(parsed.sections.popular).toHaveLength(1);
  });

  it("rejects a response with the wrong shape", () => {
    expect(homeResponseSchema.safeParse({ banners: {} }).success).toBe(false);
  });
});
