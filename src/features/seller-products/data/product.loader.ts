import "server-only";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { parseOwnedProduct, ProductMappingError, type OwnedProduct } from "../mappers/product-form.mapper";

const LOAD_TIMEOUT_MS = 8_000;

export type OwnedProductResult = { status: "ok"; product: OwnedProduct } | { status: "not-found" } | { status: "unauthorized" };

/** The product could not be loaded for a reason other than "not found" or "not logged in". */
export class ProductLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductLoadError";
  }
}

/**
 * GET /products/mine/:id with the user's token. Someone else's product answers 404 like a missing one.
 * Other failures throw, so the route's error page shows.
 */
export async function getOwnedProduct(token: string, productId: string): Promise<OwnedProductResult> {
  if (!/^\d{1,9}$/.test(productId)) return { status: "not-found" };

  const result = await requestJson(`${getEnv().API_BASE_URL}/products/mine/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: LOAD_TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "http" && result.status === 401) return { status: "unauthorized" };
    if (result.reason === "http" && result.status === 404) return { status: "not-found" };
    logServerError("product.load_failed", { endpoint: "/products/mine/:id", status: result.status, reason: result.reason });
    throw new ProductLoadError("Could not load the product.");
  }

  try {
    return { status: "ok", product: parseOwnedProduct(result.data) };
  } catch (error) {
    if (error instanceof ProductMappingError) {
      logServerError("product.unexpected_response", { endpoint: "/products/mine/:id", status: result.status });
    }
    throw error;
  }
}
