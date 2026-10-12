import { makeProduct } from "@/features/home/components/home.fixture";
import type { ProductDetail, ProductPageData, ProductReview } from "../types";

export const LONG_DESCRIPTION = "Banana Fruit from Bali, Indonesia. ".repeat(10).trim();

const REVIEW_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.";

export const TEST_REVIEWS: ProductReview[] = [
  { id: "r1", username: "username", avatarUrl: "/images/dummy/avatar-1.jpg", rating: 4, createdAgo: "1 week ago", text: REVIEW_TEXT },
  { id: "r2", username: "username", avatarUrl: "/images/dummy/avatar-1.jpg", rating: 4, createdAgo: "1 week ago", text: REVIEW_TEXT },
  { id: "r3", username: "username", rating: 3, createdAgo: "2 weeks ago", text: REVIEW_TEXT },
];

export function makeProductDetail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "p1",
    slug: "bali-banana-fruit",
    name: "Bali's Banana Fruit",
    description: LONG_DESCRIPTION,
    categorySlug: "fruits",
    categoryName: "Fruits",
    soldCount: 501,
    rating: { average: 3.4, ratingCount: 212, reviewCount: 104 },
    images: [
      { id: "i1", url: "/images/dummy/banana-1.jpg", alt: "Bali's Banana Fruit image 1" },
      { id: "i2", url: "/images/dummy/banana-2.jpg", alt: "Bali's Banana Fruit image 2" },
    ],
    variants: [
      { id: "v1", label: "500 g", price: 1000, stock: 250, unit: "kg" },
      { id: "v2", label: "1 kg", price: 2000, stock: 3, unit: "kg" },
      { id: "v3", label: "2 kg", price: 3800, stock: 0, unit: "kg" },
    ],
    defaultVariantId: "v1",
    shop: { slug: "tani-makmur", name: "Tani Makmur", city: "Kab. Bandung", rating: 4.7, ratingCount: 340 },
    reviewPreview: TEST_REVIEWS,
    ...overrides,
  };
}

/** Test data shaped like the result of getProductPage(). */
export function makePageData(product: ProductDetail = makeProductDetail()): ProductPageData {
  return {
    product,
    shopProducts: [makeProduct(2), makeProduct(3)],
    recommended: [makeProduct(4), makeProduct(5)],
  };
}
