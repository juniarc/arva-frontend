import "server-only";
import { slugify } from "@/lib/format";
import { getProductDetail as fetchProductDetail, getProducts } from "../api/catalog.server";
import type { Product, ProductDetail, ProductPageData, ProductShop } from "../types";
import { DUMMY_REVIEWS, getDummyReviewSummary } from "./dummy-reviews";

const RELATED_LIMIT = 6;

/** GET /products/:slug. Returns null for an unknown slug; throws for any other failure so the error page shows. */
export async function getProductDetail(slug: string): Promise<ProductDetail | null> {
  const result = await fetchProductDetail(slug);
  if (result.ok) return result.product;
  if (result.status === 404) return null;
  throw new Error(result.message);
}

/**
 * The API only gives a shop's name, so the slug is made from it and the shop page does not exist yet.
 * Rating and logo are not in the API, so they are left out.
 */
function toShop(product: ProductDetail): ProductShop {
  return { slug: slugify(product.shopName), name: product.shopName, city: product.city };
}

/** GET /products has no shop filter, so the popular list is filtered here. */
async function getRelatedProducts(product: ProductDetail): Promise<{ shopProducts: Product[]; recommended: Product[] }> {
  const popular = await getProducts({ sort: "popular", limit: 48 });
  const others = popular.filter((item) => item.id !== product.id);

  return {
    shopProducts: others.filter((item) => item.shopName === product.shopName).slice(0, RELATED_LIMIT),
    recommended: others.filter((item) => item.shopName !== product.shopName).slice(0, RELATED_LIMIT),
  };
}

/** Everything the product page needs, or null when the product does not exist. */
export async function getProductPage(slug: string): Promise<ProductPageData | null> {
  const product = await getProductDetail(slug);
  if (!product) return null;

  const { shopProducts, recommended } = await getRelatedProducts(product);

  return {
    product,
    // The API has one image per product, so the gallery has one image until it returns a list.
    images: [{ id: `${product.id}-main`, url: product.imageUrl, alt: product.name }],
    shop: toShop(product),
    reviewSummary: getDummyReviewSummary(product.rating),
    reviews: DUMMY_REVIEWS,
    shopProducts,
    recommended,
  };
}
