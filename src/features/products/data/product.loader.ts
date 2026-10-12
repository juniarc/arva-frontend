import "server-only";
import {
  getProductDetail as fetchProductDetail,
  getProducts,
  getRecommendedProducts,
} from "../api/catalog.server";
import type { ProductDetail, ProductPageData } from "../types";

const RELATED_LIMIT = 6;

/** GET /products/:slug. Returns null for an unknown slug; throws for any other failure so the error page shows. */
export async function getProductDetail(slug: string): Promise<ProductDetail | null> {
  const result = await fetchProductDetail(slug);
  if (result.ok) return result.product;
  if (result.status === 404) return null;
  throw new Error(result.message);
}

/** Everything the product page needs, or null when the product does not exist. */
export async function getProductPage(slug: string): Promise<ProductPageData | null> {
  const product = await getProductDetail(slug);
  if (!product) return null;

  // Related lists are optional: both calls return an empty list on failure.
  const [shopProducts, recommended] = await Promise.all([
    getProducts({ shop: product.shop.slug, exclude: product.id, sort: "popular", limit: RELATED_LIMIT }),
    getRecommendedProducts({ exclude: product.id, excludeShop: product.shop.slug, limit: RELATED_LIMIT }),
  ]);

  return { product, shopProducts, recommended };
}
