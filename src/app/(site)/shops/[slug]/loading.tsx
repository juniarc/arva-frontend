import { ProductGridSkeleton } from "@/features/products/components/ProductGrid";

/** Skeleton with the same blocks as the shop page (logo, rating box, description, grid), so nothing jumps. */
export default function ShopLoading() {
  return (
    <div role="status" aria-label="Loading the shop" className="mx-auto max-w-300 px-4 pb-10 pt-4 lg:px-6 lg:pt-8">
      <div className="animate-pulse">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="size-16 rounded-full bg-surface lg:size-20" />
            <div className="space-y-2">
              <div className="h-6 w-40 rounded-sm bg-surface" />
              <div className="h-4 w-24 rounded-sm bg-surface" />
            </div>
          </div>
          <div className="h-20 rounded-md bg-surface lg:w-80" />
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-6 w-48 rounded-sm bg-surface" />
          <div className="h-4 max-w-2xl rounded-sm bg-surface" />
          <div className="h-4 w-2/3 rounded-sm bg-surface" />
        </div>
        <div className="mb-4 mt-8 h-7 w-32 rounded-sm bg-surface" />
      </div>
      <ProductGridSkeleton />
    </div>
  );
}
