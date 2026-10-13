/** Skeleton with the same layout and reserved heights as the cart, so nothing jumps when it loads. */
function RowSkeleton() {
  return (
    <div className="flex gap-3 py-3">
      <div className="size-6 shrink-0 rounded-sm bg-surface" />
      <div className="size-22 shrink-0 rounded-md bg-surface md:size-28 lg:size-24" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded-sm bg-surface" />
        <div className="h-3 w-1/4 rounded-sm bg-surface" />
        <div className="h-5 w-1/3 rounded-sm bg-surface" />
      </div>
    </div>
  );
}

export default function CartLoading() {
  return (
    <div role="status" aria-label="Loading your cart" className="mx-auto max-w-300 animate-pulse px-4 py-4 lg:px-6 lg:py-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,65fr)_minmax(0,30fr)] lg:gap-8">
        <div>
          <div className="mb-3 h-11 rounded-sm bg-surface" />
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
        <div className="hidden h-44 rounded-lg bg-surface lg:block" />
      </div>
    </div>
  );
}
