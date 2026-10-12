import { makeProduct } from "@/features/home/components/home.fixture";
import { DUMMY_REVIEWS, getDummyReviewSummary } from "../data/dummy-reviews";
import type { ProductDetail, ProductPageData } from "../types";

export const LONG_DESCRIPTION = "Banana Fruit from Bali, Indonesia. ".repeat(10).trim();

export function makeProductDetail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    ...makeProduct(1, { slug: "bali-banana-fruit", name: "Bali's Banana Fruit", shopName: "Tani Makmur" }),
    description: LONG_DESCRIPTION,
    variants: [
      { id: "v1", label: "500 g", price: 1000, stock: 250, unit: "kg" },
      { id: "v2", label: "1 kg", price: 2000, stock: 3, unit: "kg" },
      { id: "v3", label: "2 kg", price: 3800, stock: 0, unit: "kg" },
    ],
    ...overrides,
  };
}

/** Test data shaped like the result of getProductPage(). */
export function makePageData(product: ProductDetail = makeProductDetail()): ProductPageData {
  return {
    product,
    images: [{ id: "i1", url: product.imageUrl, alt: product.name }],
    shop: { slug: "tani-makmur", name: "Tani Makmur", city: "Kab. Bandung" },
    reviewSummary: getDummyReviewSummary(product.rating),
    reviews: DUMMY_REVIEWS,
    shopProducts: [makeProduct(2), makeProduct(3)],
    recommended: [makeProduct(4), makeProduct(5)],
  };
}
