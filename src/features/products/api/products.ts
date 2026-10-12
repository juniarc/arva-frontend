import { requestJson } from "@/lib/api/http";
import type { ProductDetail, ProductReview } from "../types";

export type ProductDetailResult = { ok: true; product: ProductDetail } | { ok: false; message: string };
export type ReviewPageResult = { ok: true; reviews: ProductReview[]; total: number } | { ok: false; message: string };

const LOAD_FAILED = "Could not load this product. Please try again.";
const REVIEWS_FAILED = "Could not load reviews. Please try again.";

function messageFrom(body: unknown): string | undefined {
  if (typeof body === "object" && body !== null && "message" in body) {
    const { message } = body;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return undefined;
}

/** Browser-side: loads one product with all its variants through our own /api/products/:slug route. */
export async function fetchProductDetail(slug: string): Promise<ProductDetailResult> {
  const result = await requestJson<{ product: ProductDetail }>(`/api/products/${encodeURIComponent(slug)}`);

  if (result.ok) return { ok: true, product: result.data.product };
  return { ok: false, message: (result.reason === "http" && messageFrom(result.body)) || LOAD_FAILED };
}

/** Browser-side: loads one page of a product's reviews through our own /api/products/:slug/reviews route. */
export async function fetchReviews(slug: string, page: number): Promise<ReviewPageResult> {
  const result = await requestJson<{ reviews: ProductReview[]; total: number }>(
    `/api/products/${encodeURIComponent(slug)}/reviews?page=${page}`,
  );

  if (result.ok) return { ok: true, reviews: result.data.reviews, total: result.data.total };
  return { ok: false, message: (result.reason === "http" && messageFrom(result.body)) || REVIEWS_FAILED };
}
