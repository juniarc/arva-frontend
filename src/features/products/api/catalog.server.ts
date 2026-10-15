import "server-only";
import type { z } from "zod";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import {
  categoriesResponseSchema,
  homeResponseSchema,
  productListResponseSchema,
  reviewListResponseSchema,
  productDetailResponseSchema,
  type HomeResponse,
} from "../schemas/catalog.schema";
import type { Category, Product, ProductDetail, ProductReview } from "../types";

/**
 * Server-only reads of the public catalog endpoints.
 * Home and categories are cached briefly; a product detail is not, because stock changes.
 */

const CATALOG_REVALIDATE_SECONDS = 60;

async function fetchCatalog<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  revalidateSeconds?: number,
): Promise<z.infer<S> | undefined> {
  const result = await requestJson(`${getEnv().API_BASE_URL}${path}`, { revalidateSeconds });
  if (!result.ok) {
    logServerError("catalog.request_failed", { endpoint: path, status: result.status, reason: result.reason });
    return undefined;
  }

  const parsed = schema.safeParse(result.data);
  if (!parsed.success) {
    logServerError("catalog.unexpected_response", { endpoint: path, status: result.status });
    return undefined;
  }
  return parsed.data;
}

/** GET /home. Throws when the page cannot be built, so the error page is shown. */
export async function getHome(): Promise<HomeResponse> {
  const data = await fetchCatalog("/home", homeResponseSchema, CATALOG_REVALIDATE_SECONDS);
  if (!data) throw new Error("Could not load the home page.");
  return data;
}

/** GET /categories. Returns an empty list on failure: the page still works without category links. */
export async function getCategories(): Promise<Category[]> {
  const data = await fetchCatalog("/categories", categoriesResponseSchema, CATALOG_REVALIDATE_SECONDS);
  return data?.categories ?? [];
}

export interface ProductListQuery {
  category?: string;
  /** A shop slug. */
  shop?: string;
  /** A product id to leave out. */
  exclude?: string;
  sort?: "popular" | "newest" | "price_asc" | "price_desc";
  /** The backend allows up to 48. */
  limit?: number;
}

/** GET /products. Returns an empty list on failure: the sections that use it are optional. */
export async function getProducts(query: ProductListQuery = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.shop) params.set("shop", query.shop);
  if (query.exclude) params.set("exclude", query.exclude);
  if (query.sort) params.set("sort", query.sort);
  if (query.limit) params.set("limit", String(query.limit));
  const queryString = params.toString();

  const data = await fetchCatalog(
    `/products${queryString ? `?${queryString}` : ""}`,
    productListResponseSchema,
    CATALOG_REVALIDATE_SECONDS,
  );
  return data?.products ?? [];
}

/** GET /products/recommended: best sellers, leaving out one product and every product of one shop. */
export async function getRecommendedProducts(options: {
  exclude: string;
  excludeShop: string;
  limit?: number;
}): Promise<Product[]> {
  const params = new URLSearchParams({ exclude: options.exclude, excludeShop: options.excludeShop });
  if (options.limit) params.set("limit", String(options.limit));

  const data = await fetchCatalog(
    `/products/recommended?${params.toString()}`,
    productListResponseSchema,
    CATALOG_REVALIDATE_SECONDS,
  );
  return data?.products ?? [];
}

export type ReviewPageResult =
  | { ok: true; reviews: ProductReview[]; total: number }
  | { ok: false; status: number; message: string };

/** GET /products/:slug/reviews. */
export async function getProductReviews(slug: string, page: number, limit: number): Promise<ReviewPageResult> {
  const path = `/products/${encodeURIComponent(slug)}/reviews?page=${page}&limit=${limit}`;
  const result = await requestJson(`${getEnv().API_BASE_URL}${path}`);

  if (!result.ok) {
    if (result.reason === "http" && result.status === 404) {
      return { ok: false, status: 404, message: "Product not found." };
    }
    logServerError("catalog.request_failed", { endpoint: "/products/:slug/reviews", status: result.status, reason: result.reason });
    return { ok: false, status: 502, message: "Could not load reviews. Please try again." };
  }

  const parsed = reviewListResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    logServerError("catalog.unexpected_response", { endpoint: "/products/:slug/reviews", status: result.status });
    return { ok: false, status: 502, message: "Could not load reviews. Please try again." };
  }
  return { ok: true, reviews: parsed.data.reviews, total: parsed.data.pagination.total };
}

export type ProductDetailResult =
  | { ok: true; product: ProductDetail }
  | { ok: false; status: number; message: string };

/** GET /products/:slug. */
export async function getProductDetail(slug: string): Promise<ProductDetailResult> {
  const path = `/products/${encodeURIComponent(slug)}`;
  const result = await requestJson(`${getEnv().API_BASE_URL}${path}`);

  if (!result.ok) {
    if (result.reason === "http" && result.status === 404) {
      return { ok: false, status: 404, message: "Product not found." };
    }
    logServerError("catalog.request_failed", { endpoint: "/products/:slug", status: result.status, reason: result.reason });
    return { ok: false, status: 502, message: "Could not load this product. Please try again." };
  }

  const parsed = productDetailResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    logServerError("catalog.unexpected_response", { endpoint: "/products/:slug", status: result.status });
    return { ok: false, status: 502, message: "Could not load this product. Please try again." };
  }
  return { ok: true, product: parsed.data.product };
}
