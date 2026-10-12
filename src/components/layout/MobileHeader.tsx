import { Menu, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";

const ICON_BUTTON =
  "relative flex size-11 items-center justify-center rounded-sm border border-white text-white " +
  "hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const MENU_LINKS = [
  { href: "/wishlist", label: "Wishlist" },
  { href: "/profile", label: "My Profile" },
  { href: "/bulk-orders", label: "Bulk Order Inquiries" },
  { href: "/help", label: "Help Center" },
];

/** Compact green header for small screens: logo, search, cart, and a menu. */
export function MobileHeader({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header className="relative bg-brand md:hidden">
      <div className="flex items-center gap-3 px-4 py-2">
        <Link href="/" className="mr-auto font-serif text-3xl font-black text-white">
          Arva
        </Link>

        <Link href="/search" aria-label="Search" className={ICON_BUTTON}>
          <Search className="size-5" aria-hidden="true" />
        </Link>

        <Link href="/cart" aria-label="Cart" className={ICON_BUTTON}>
          <ShoppingBag className="size-5" aria-hidden="true" />
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
              <span className="sr-only">{cartCount} items</span>
              <span aria-hidden="true">{cartCount}</span>
            </span>
          )}
        </Link>

        <details className="group">
          <summary
            aria-label="Menu"
            className={`${ICON_BUTTON} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
          >
            <Menu className="size-5" aria-hidden="true" />
          </summary>
          <nav
            aria-label="Menu"
            className="absolute inset-x-0 top-full z-10 flex flex-col bg-brand px-4 pb-3 shadow-md"
          >
            {MENU_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center border-t border-white/20 text-sm text-white hover:underline"
              >
                {label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
