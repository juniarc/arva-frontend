import { MapPin } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import type { Shop } from "../types";

/** The round logo (or the shop's first letter), the shop name (the page's h1) and the city. */
export function ShopHeader({ shop }: { shop: Shop }) {
  return (
    <div className="flex items-center gap-3 lg:gap-4">
      <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-2xl font-bold text-white lg:size-20 lg:text-3xl">
        {shop.logoUrl ? (
          <SafeImage src={shop.logoUrl} alt="" fill sizes="(min-width: 1024px) 5rem, 4rem" className="object-cover" />
        ) : (
          <span aria-hidden="true">{shop.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0">
        <h1 className="break-words text-xl font-bold text-ink lg:text-2xl">{shop.name}</h1>
        <p className="flex items-center gap-1 text-xs text-muted lg:text-sm">
          <MapPin className="size-3 shrink-0 lg:size-4" aria-hidden="true" />
          {shop.city}
        </p>
      </div>
    </div>
  );
}
