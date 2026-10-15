import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { CART_PREVIEW_LIMIT, linePrice } from "@/lib/navbar/navbar.mapper";
import type { NavbarCart } from "@/lib/navbar/navbar.types";
import { PANEL } from "./navbar-styles";

export const CART_UNAVAILABLE = "Cart is not available right now.";

/** The cart preview: the count, up to 3 items, and links to the cart. `cart` null means it could not be loaded. */
export function CartDropdown({ id, open, cart }: { id: string; open: boolean; cart: NavbarCart | null }) {
  const items = cart?.items.slice(0, CART_PREVIEW_LIMIT) ?? [];

  return (
    <div id={id} role="region" aria-label="Cart preview" hidden={!open} className={PANEL}>
      <div className="flex items-baseline gap-1.5 border-b border-line/30 pb-3">
        <p className="font-serif text-2xl font-bold text-ink">Cart</p>
        {cart && <span className="text-sm text-muted">({cart.itemCount})</span>}
        <Link href="/cart" className="ml-auto text-sm font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-info">
          See
        </Link>
      </div>

      {!cart ? (
        <p className="pt-3 text-sm text-muted">{CART_UNAVAILABLE}</p>
      ) : items.length === 0 ? (
        <div className="pt-3 text-sm">
          <p className="text-muted">Your cart is empty.</p>
          <Link href="/products" className="mt-1 inline-block font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-info">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <ul>
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 border-b border-line/30 py-3 last:border-b-0">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-surface">
                  <SafeImage src={item.imageUrl} alt="" fill sizes="2.5rem" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-ink">{item.name}</p>
                  <p className="truncate text-[11px] text-muted">{item.variantLabel}</p>
                </div>
                <p className="shrink-0 text-xs font-bold text-ink">{linePrice(item.quantity, item.unitPrice)}</p>
              </li>
            ))}
          </ul>
          {cart.items.length > CART_PREVIEW_LIMIT && (
            <Link href="/cart" className="mt-2 block text-center text-xs font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-info">
              See all ({cart.itemCount})
            </Link>
          )}
        </>
      )}
    </div>
  );
}
