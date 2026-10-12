import { requestJson } from "@/lib/api/http";
import type { ProductDetail } from "../types";

export type ProductDetailResult = { ok: true; product: ProductDetail } | { ok: false; message: string };

const LOAD_FAILED = "Could not load this product. Please try again.";

/** Browser-side: loads one product with all its variants through our own /api/products/:slug route. */
export async function fetchProductDetail(slug: string): Promise<ProductDetailResult> {
  const result = await requestJson<{ product: ProductDetail }>(`/api/products/${encodeURIComponent(slug)}`);

  if (result.ok) return { ok: true, product: result.data.product };

  if (result.reason === "http" && typeof result.body === "object" && result.body !== null && "message" in result.body) {
    const { message } = result.body;
    if (typeof message === "string" && message.length > 0) return { ok: false, message };
  }
  return { ok: false, message: LOAD_FAILED };
}
