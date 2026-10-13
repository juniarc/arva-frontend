import "server-only";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { PRODUCTS_PAGE_SIZE } from "../constants/page-size";
import { parseProductList, ProductListMappingError, type ProductListPage } from "../mappers/product-list.mapper";
import { hasActiveFilters, toApiParams, type ProductsQuery } from "../query/products-query";

const LOAD_TIMEOUT_MS = 8_000;
const DEFAULT_QUERY_REVALIDATE_SECONDS = 60;

export interface ProductListResult extends ProductListPage {
  /** True when the backend rejected a filter, so the list shows all products instead. */
  filtersDropped: boolean;
}

/** The product list could not be loaded. The route's error page shows. */
export class ProductListError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductListError";
  }
}

async function fetchList(query: ProductsQuery) {
  // The unfiltered list is public and the same for everyone, so it can be cached briefly.
  // A query with the user's choices is not cached, so a filter never shows stale results.
  const revalidateSeconds = hasActiveFilters(query) ? undefined : DEFAULT_QUERY_REVALIDATE_SECONDS;
  const params = toApiParams(query, PRODUCTS_PAGE_SIZE);

  return requestJson(`${getEnv().API_BASE_URL}/products?${params.toString()}`, {
    timeoutMs: LOAD_TIMEOUT_MS,
    revalidateSeconds,
  });
}

/** GET /products. Throws ProductListError when the list cannot be built. */
export async function getProductList(query: ProductsQuery): Promise<ProductListResult> {
  let result = await fetchList(query);
  let filtersDropped = false;

  // The backend refused a value (400). Show all products instead of an error page.
  if (!result.ok && result.reason === "http" && result.status === 400) {
    logServerError("products.list_rejected", { endpoint: "/products", status: 400 });
    result = await fetchList({ page: query.page });
    filtersDropped = true;
  }

  if (!result.ok) {
    logServerError("products.list_failed", { endpoint: "/products", status: result.status, reason: result.reason });
    throw new ProductListError("Could not load the products.");
  }

  try {
    return { ...parseProductList(result.data), filtersDropped };
  } catch (error) {
    if (error instanceof ProductListMappingError) {
      logServerError("products.unexpected_response", { endpoint: "/products", status: result.status });
    }
    throw error;
  }
}
