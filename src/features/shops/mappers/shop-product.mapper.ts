import type { Product } from "@/features/products/types";
import { shopProductsResponseSchema, type ShopProductItemDto } from "../schemas/shop.schema";
import type { OwnerShopProduct, ShopPagination, ShopProduct } from "../types";
import { ShopMappingError } from "./shop.mapper";

/** A backend item to the `Product` the ProductCard uses. The shop's list has no category slug, and the card does not use it. */
function toProduct(item: ShopProductItemDto): Product {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    categorySlug: "",
    categoryName: item.categoryName,
    price: item.price,
    originalPrice: item.originalPrice ?? undefined,
    discountPercent: item.discountPercent ?? undefined,
    rating: item.rating,
    soldCount: item.soldCount,
    city: item.city,
    imageUrl: item.imageUrl,
    shopSlug: item.shop.slug,
    shopName: item.shop.name,
  };
}

export function toShopProduct(item: ShopProductItemDto): ShopProduct {
  return { product: toProduct(item), manage: item.manage ?? null };
}

export interface ShopProductsPage {
  products: ShopProduct[];
  pagination: ShopPagination;
}

/** Throws ShopMappingError when the response has the wrong shape. */
export function parseShopProducts(data: unknown): ShopProductsPage {
  const result = shopProductsResponseSchema.safeParse(data);
  if (!result.success) throw new ShopMappingError("Unexpected shop products response shape.");
  return { products: result.data.products.map(toShopProduct), pagination: result.data.pagination };
}

export function hasManage(item: ShopProduct): item is OwnerShopProduct {
  return item.manage !== null;
}

/** "Blue, 100 ml": the variant labels from the backend, joined for display. A dash when there are none. */
export function variantsText(labels: string[]): string {
  const clean = labels.map((label) => label.trim()).filter(Boolean);
  return clean.length > 0 ? clean.join(", ") : "-";
}
