import {
  productListPageSchema,
  type Pagination,
  type ProductListItem,
} from "../schemas/product-list.schema";
import type { Product } from "../types";

/** The backend sent a product list the page cannot use. */
export class ProductListMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductListMappingError";
  }
}

/** Backend list item to the `Product` type the ProductCard uses. */
export function toProduct(item: ProductListItem): Product {
  const shopSlug = item.shop?.slug ?? item.shopSlug;
  const shopName = item.shop?.name ?? item.shopName;
  if (shopSlug === undefined || shopName === undefined) {
    throw new ProductListMappingError("Product list item has no shop.");
  }

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    categorySlug: item.categorySlug,
    categoryName: item.categoryName,
    price: item.price,
    originalPrice: item.originalPrice,
    discountPercent: item.discountPercent,
    rating: item.rating,
    soldCount: item.soldCount,
    city: item.city,
    imageUrl: item.imageUrl,
    shopSlug,
    shopName,
  };
}

export interface ProductListPage {
  products: Product[];
  pagination: Pagination;
}

/** Validates an unknown response body and maps it. Throws ProductListMappingError when the shape is wrong. */
export function parseProductList(data: unknown): ProductListPage {
  const parsed = productListPageSchema.safeParse(data);
  if (!parsed.success) throw new ProductListMappingError("Unexpected product list response shape.");
  return { products: parsed.data.products.map(toProduct), pagination: parsed.data.pagination };
}
