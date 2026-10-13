/** Skeleton with the same two columns and section heights as the profile, so nothing jumps when it loads. */
export default function ProfileLoading() {
  return (
    <div role="status" aria-label="Loading your profile" className="mx-auto max-w-275 animate-pulse lg:px-6 lg:py-8">
      <div className="bg-white px-4 pb-6 lg:rounded-md lg:border lg:border-line/30 lg:p-8">
        <div className="mb-6 hidden h-9 w-48 rounded-sm bg-surface lg:block" />
        <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-8">
          <div className="flex flex-col items-center gap-3 py-4 lg:items-stretch lg:py-0">
            <div className="size-24 rounded-md bg-surface lg:size-auto lg:aspect-square lg:w-full" />
            <div className="h-9 w-40 rounded-sm bg-surface lg:w-full" />
          </div>
          <div className="space-y-3">
            <div className="h-7 w-40 rounded-sm bg-surface" />
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-9 rounded-sm bg-surface" />
            ))}
            <div className="h-7 w-32 rounded-sm bg-surface pt-4" />
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-9 rounded-sm bg-surface" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
