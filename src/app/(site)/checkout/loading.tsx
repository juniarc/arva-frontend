/** Skeleton with the same layout and reserved heights as the checkout, so nothing jumps when it loads. */
export default function CheckoutLoading() {
  return (
    <div role="status" aria-label="Loading checkout" className="mx-auto max-w-300 animate-pulse px-4 py-4 lg:px-6 lg:py-8">
      <div className="mb-4 h-9 w-40 rounded-sm bg-surface" />
      <div className="lg:grid lg:grid-cols-[minmax(0,65fr)_minmax(0,30fr)] lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="h-16 rounded-sm bg-surface" />
          <div className="h-56 rounded-sm bg-surface" />
          <div className="h-14 rounded-md bg-surface" />
          <div className="h-14 rounded-md bg-surface" />
          <div className="h-24 rounded-sm bg-surface" />
        </div>
        <div className="mt-4 h-72 rounded-lg bg-surface lg:mt-0" />
      </div>
    </div>
  );
}
