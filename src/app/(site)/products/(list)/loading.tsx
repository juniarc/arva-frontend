import { ProductGridSkeleton } from "@/features/products/components/ProductGrid";

/** Shown while the page itself loads (the filters are not known yet). Same grid as the real page. */
export default function ProductsLoading() {
  return (
    <div role="status" aria-label="Loading products" className="mx-auto max-w-300 px-4 py-6 lg:px-6 lg:py-8">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6">
        <div className="hidden h-96 animate-pulse rounded-md bg-surface lg:block" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
