import { Star } from "lucide-react";
import type { Shop } from "../types";

/** "09:00" and "19:00" as "09:00 - 19:00". */
export function formatHours(hours: Shop["operatingHours"]): string {
  return `${hours.open} - ${hours.close}`;
}

/**
 * The rating and the operating hours. On mobile and tablet they sit side by side in a dark green box;
 * from 1024px they are plain, with a vertical line between them.
 */
export function ShopRatingBox({ shop }: { shop: Shop }) {
  const { average, ratingCount } = shop.rating;
  const rated = ratingCount > 0;
  const label = rated
    ? `Rated ${average.toFixed(1)} out of 5 from ${ratingCount} ${ratingCount === 1 ? "rating" : "ratings"}.`
    : "No ratings yet.";

  return (
    <div className="flex items-stretch rounded-md bg-brand py-3 text-white lg:gap-6 lg:bg-transparent lg:py-0 lg:text-ink">
      <div className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 lg:flex-none lg:px-0">
        <span className="sr-only">{label}</span>
        <p aria-hidden="true" className="flex items-center gap-1 text-lg font-bold">
          <Star className="size-5 fill-star text-star" />
          {rated ? average.toFixed(1) : "-"}
        </p>
        <p aria-hidden="true" className="text-xs">
          Ratings and Reviews
        </p>
      </div>

      <div aria-hidden="true" className="w-px self-stretch bg-white/50 lg:bg-line/50" />

      <div className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 lg:flex-none">
        <p className="text-lg font-bold">
          <span className="sr-only">Operating hours: </span>
          {formatHours(shop.operatingHours)}
        </p>
        <p aria-hidden="true" className="text-xs">
          Operating Hours
        </p>
      </div>
    </div>
  );
}
