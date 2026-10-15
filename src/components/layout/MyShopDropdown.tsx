import { MapPin, Star } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import type { NavbarShop } from "@/lib/navbar/navbar.types";
import { PANEL } from "./navbar-styles";

export const NO_SHOP_TEXT = "You don't have any shop yet";

/** No shop: a Create Shop button. A shop: its card with a Visit link. */
export function MyShopDropdown({ id, open, shop }: { id: string; open: boolean; shop: NavbarShop }) {
  if (shop.status === "none") {
    return (
      <div id={id} role="region" aria-label="My shop" hidden={!open} className={`${PANEL} w-64 text-center`}>
        <p className="mb-3 text-xs text-ink">{NO_SHOP_TEXT}</p>
        <ButtonLink href="/my-shop/create" variant="brand" className="min-h-9 text-xs">
          Create Shop
        </ButtonLink>
      </div>
    );
  }

  return (
    <div id={id} role="region" aria-label="My shop" hidden={!open} className={`${PANEL} w-96`}>
      <p className="border-b border-line/30 pb-3 font-serif text-2xl font-bold text-ink">My Shop</p>
      <div className="flex items-center gap-3 pt-3">
        <Avatar src={shop.logoUrl} name={shop.name} kind="shop" size="xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{shop.name}</p>
          {shop.city && (
            <p className="flex items-center gap-1 text-xs text-muted">
              <MapPin className="size-3" aria-hidden="true" />
              {shop.city}
            </p>
          )}
          {shop.rating && (
            <p className="flex items-center gap-1 text-xs text-muted">
              <Star className="size-3 fill-star text-star" aria-hidden="true" />
              <span className="sr-only">Rating </span>
              {shop.rating.average.toFixed(1)} ({shop.rating.ratingCount.toLocaleString("id-ID")})
            </p>
          )}
        </div>
        <Link
          href={`/shops/${shop.slug}`}
          className="flex min-h-9 items-center rounded-sm bg-chip px-4 text-xs font-medium text-ink hover:brightness-95 focus-visible:outline-2 focus-visible:outline-info"
        >
          Visit
          <span className="sr-only"> {shop.name}</span>
        </Link>
      </div>
    </div>
  );
}
