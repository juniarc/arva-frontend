import { Star } from "lucide-react";

/** Yellow star with a one-decimal rating. */
export function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="size-3 fill-star text-star" aria-hidden="true" />
      <span>{value.toFixed(1)}</span>
      <span className="sr-only">out of 5</span>
    </span>
  );
}
