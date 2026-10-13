/** Skeleton with the same grid and card proportions as the wishlist, so nothing jumps when it loads. */
export default function WishlistLoading() {
  return (
    <div role="status" aria-label="Loading your wishlist" className="mx-auto max-w-300 animate-pulse px-4 py-4 lg:px-6 lg:py-8">
      <div className="mb-4 h-9 w-56 rounded-sm bg-surface" />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {Array.from({ length: 10 }, (_, index) => (
          <li key={index} className="overflow-hidden rounded-md border border-line/30">
            <div className="aspect-[4/3] bg-surface" />
            <div className="space-y-2 p-3">
              <div className="h-2.5 w-1/3 rounded-sm bg-surface" />
              <div className="h-10 rounded-sm bg-surface" />
              <div className="h-4 w-1/2 rounded-sm bg-surface" />
              <div className="h-11 rounded-sm bg-surface lg:h-8" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
