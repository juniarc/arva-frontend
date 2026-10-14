/** Skeleton with the same order cards as the page, so nothing jumps when the orders arrive. */
export default function OrdersLoading() {
  return (
    <div role="status" aria-label="Loading your orders" className="mx-auto max-w-3xl animate-pulse px-4 pb-10 pt-4 lg:px-6 lg:pt-8">
      <div className="mb-6 h-8 w-40 rounded-sm bg-surface" />
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="mb-4 rounded-md border border-line/30">
          <div className="flex justify-between border-b border-line/30 px-4 py-3">
            <div className="space-y-2">
              <div className="h-4 w-40 rounded-sm bg-surface" />
              <div className="h-3 w-28 rounded-sm bg-surface" />
            </div>
            <div className="h-6 w-16 rounded-full bg-surface" />
          </div>
          <div className="flex gap-3 px-4 py-3">
            <div className="size-14 rounded-sm bg-surface" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded-sm bg-surface" />
              <div className="h-3 w-1/3 rounded-sm bg-surface" />
            </div>
          </div>
          <div className="h-11 border-t border-line/30" />
        </div>
      ))}
    </div>
  );
}
