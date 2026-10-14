import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Pagination } from "@/features/products/components/Pagination";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { hasManage } from "../mappers/shop-product.mapper";
import type { ShopProductsResult } from "../data/shop.loader";
import { OwnerProductList } from "./OwnerProductList";

export const PRODUCTS_UNAVAILABLE_MESSAGE = "Products are not available right now.";
export const NO_PRODUCTS_MESSAGE = "This shop has no products yet.";

interface ShopProductsProps {
  slug: string;
  isOwner: boolean;
  isLoggedIn: boolean;
  result: ShopProductsResult;
}

/** Owner only: opens the product form. */
function AddProductButton() {
  return (
    <ButtonLink href="/my-shop/products/new" variant="brand" className="w-auto px-4 text-xs">
      <Plus className="size-3" aria-hidden="true" />
      Add New Product
    </ButtonLink>
  );
}

/** The products section. When the products cannot be loaded, only this section says so: the rest of the page stays. */
export function ShopProducts({ slug, isOwner, isLoggedIn, result }: ShopProductsProps) {
  const hrefFor = (page: number) => (page <= 1 ? `/shops/${slug}` : `/shops/${slug}?page=${page}`);

  return (
    <section aria-labelledby="shop-products-heading" className="mt-8">
      <div className="mb-4 flex items-center gap-4">
        <h2 id="shop-products-heading" className="font-serif text-xl font-bold text-ink lg:text-2xl">
          Products
        </h2>
        {isOwner && <AddProductButton />}
      </div>

      {result.status === "error" ? (
        <p className="py-8 text-center text-sm text-muted">{PRODUCTS_UNAVAILABLE_MESSAGE}</p>
      ) : result.products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted">{NO_PRODUCTS_MESSAGE}</p>
          {isOwner && <AddProductButton />}
        </div>
      ) : (
        <>
          {isOwner ? (
            <OwnerProductList items={result.products.filter(hasManage)} />
          ) : (
            <ProductGrid products={result.products.map((item) => item.product)} isLoggedIn={isLoggedIn} />
          )}
          <Pagination hrefFor={hrefFor} currentPage={result.pagination.page} totalPages={result.pagination.totalPages} />
        </>
      )}
    </section>
  );
}
