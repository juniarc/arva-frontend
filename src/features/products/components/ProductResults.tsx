import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { getProductList } from "../data/product-list.loader";
import { buildProductsHref, withPage, type ProductsQuery } from "../query/products-query";
import { EmptyProducts } from "./EmptyProducts";
import { Pagination } from "./Pagination";
import { ProductGrid } from "./ProductGrid";

/**
 * The part of the page that waits for the backend: result count, grid (or empty state) and pagination.
 * The page wraps it in <Suspense>, so the filters stay on screen while the products load.
 */
export async function ProductResults({ query, isLoggedIn }: { query: ProductsQuery; isLoggedIn: boolean }) {
  const { products, pagination, filtersDropped } = await getProductList(query);

  // A page number past the end (for example from an old link): show the last valid page instead.
  const lastPage = Math.max(1, pagination.totalPages);
  if (query.page > lastPage) redirect(buildProductsHref(withPage(query, lastPage)));

  return (
    <>
      {filtersDropped && (
        <Alert
          variant="error"
          message="Some filters could not be applied. Showing all products."
          className="mb-4"
        />
      )}

      <p aria-live="polite" className="mb-3 text-xs text-muted">
        Showing {products.length} of {pagination.total} products.
      </p>

      {products.length === 0 ? (
        <EmptyProducts search={query.q} />
      ) : (
        <ProductGrid products={products} isLoggedIn={isLoggedIn} />
      )}

      <Pagination query={query} currentPage={pagination.page} totalPages={pagination.totalPages} />
    </>
  );
}
