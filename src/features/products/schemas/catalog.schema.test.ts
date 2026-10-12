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
  shopSlug: "tani-makmur",
  shopName: "Tani Makmur",
};

const detail = {
  id: 7,
  slug: "manggo",
  name: "Manggo",
  description: null,
  categorySlug: "fruits",
  categoryName: "Fruits",
  soldCount: 501,
  rating: { average: 3.4, ratingCount: 212, reviewCount: 104 },
  images: [{ id: 3, url: "https://example.com/a.jpg", alt: "Manggo image 1" }],
  variants: [{ id: 9, label: "1 kg", unit: "kg", price: 2000, originalPrice: null, stock: 10 }],
  defaultVariantId: 9,
  shop: {
    slug: "tani-makmur",
    name: "Tani Makmur",
    city: "Kab. Bandung",
    logoUrl: null,
    rating: { average: 4.7, ratingCount: 340 },
  },
  reviewPreview: [
    {
      id: 1,
      authorName: "username",
      authorAvatarUrl: null,
      rating: 5,
      text: "Great.",
      createdAt: "2020-01-01T00:00:00.000Z",
    },
  ],
};

describe("catalog schemas", () => {
  it("turns null fields into undefined and ids into strings", () => {
    const { product: parsed } = productDetailResponseSchema.parse({ product: detail });

    expect(parsed.id).toBe("7");
    expect(parsed.defaultVariantId).toBe("9");
    expect(parsed.description).toBe("");
    expect(parsed.variants[0]).toMatchObject({ id: "9", originalPrice: undefined });
    expect(parsed.images[0]).toEqual({ id: "3", url: "https://example.com/a.jpg", alt: "Manggo image 1" });
  });

  it("flattens the shop rating and drops a missing logo", () => {
    const { product: parsed } = productDetailResponseSchema.parse({ product: detail });

    expect(parsed.shop).toEqual({
      slug: "tani-makmur",
      name: "Tani Makmur",
      city: "Kab. Bandung",
      logoUrl: undefined,
      rating: 4.7,
      ratingCount: 340,
    });
  });

  it("maps reviews to the shape the UI uses, with the date as text", () => {
    const { product: parsed } = productDetailResponseSchema.parse({ product: detail });
    const review = parsed.reviewPreview[0];

    expect(review).toMatchObject({ id: "1", username: "username", avatarUrl: undefined, rating: 5, text: "Great." });
    expect(review?.createdAgo).toMatch(/years? ago$/);
  });

  it("rejects a product with no variants", () => {
    const result = productDetailResponseSchema.safeParse({ product: { ...detail, variants: [] } });

    expect(result.success).toBe(false);
  });

  it("parses a list product with null discount fields", () => {
    const parsed = homeResponseSchema.parse({
      banners: { carousel: [], promoStrips: [], sideBanners: [], verticalBanners: [] },
      sections: { popular: [product], fruits: [], equipments: [] },
    });

    expect(parsed.sections.popular[0]).toMatchObject({ id: "1", originalPrice: undefined, shopSlug: "tani-makmur" });
  });

  it("parses the home response and allows a banner without a link", () => {
    const banner = {
      id: 1,
      title: "BIG SALE",
      subtitle: null,
      buttonLabel: "Shop now",
      linkUrl: null,
      imageUrl: "/a.jpg",
    };
    const parsed = homeResponseSchema.parse({
      banners: { carousel: [banner], promoStrips: [], sideBanners: [], verticalBanners: [] },
      sections: { popular: [product], fruits: [], equipments: [] },
    });

    expect(parsed.banners.carousel[0]).toMatchObject({ id: "1", subtitle: "", linkUrl: undefined });
    expect(parsed.sections.popular).toHaveLength(1);
  });

  it("rejects a response with the wrong shape", () => {
    expect(homeResponseSchema.safeParse({ banners: {} }).success).toBe(false);
  });
});
