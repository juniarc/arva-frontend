import { MapPin, Star } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import type { ProductShop } from "../types";

/** Shop logo, name, city, and a Visit link. The rating shows only when the shop has one. */
export function ShopCard({ shop }: { shop: ProductShop }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-lg font-bold text-white">
        {shop.logoUrl ? (
          <SafeImage src={shop.logoUrl} alt="" fill sizes="3rem" className="object-cover" />
        ) : (
          <span aria-hidden="true">{shop.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-ink">{shop.name}</p>
        <p className="flex items-center gap-1 text-xs text-muted">
          <MapPin className="size-3" aria-hidden="true" />
          {shop.city}
        </p>
        {shop.rating !== undefined && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <Star className="size-3 fill-star text-star" aria-hidden="true" />
            {shop.rating.toFixed(1)}
            {shop.ratingCount !== undefined && ` (${shop.ratingCount.toLocaleString("id-ID")})`}
          </p>
        )}
      </div>

      {/* The shop page is not built yet. */}
      <Link
        href={`/shops/${shop.slug}`}
        className="flex min-h-11 items-center rounded-sm bg-chip px-4 text-xs font-medium text-ink hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
      >
        Visit
        <span className="sr-only"> {shop.name}</span>
      </Link>
    </div>
  );
}
