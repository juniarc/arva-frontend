import { Heart, ShoppingCart, User } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";
import { MobileHeader } from "./MobileHeader";
import { SearchBar } from "./SearchBar";
import { TopBar } from "./TopBar";

interface GlobalHeaderProps {
  /** Number of items in the cart. The red badge only shows when this is above 0. */
  cartCount?: number;
}

const NAV_LINK =
  "relative flex min-h-11 min-w-11 items-center justify-center gap-1.5 text-xs text-ink " +
  "hover:text-brand focus-visible:outline-2 focus-visible:outline-info";

function NavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={NAV_LINK}>
      {children}
      {/* On small screens only the icon shows; the label stays for screen readers. */}
      <span className="sr-only md:not-sr-only">{label}</span>
    </Link>
  );
}

/** Site-wide header: utility bar, logo, search, and Wishlist / Cart / Profile links. */
export async function GlobalHeader({ cartCount = 0 }: GlobalHeaderProps) {
  // Presence check only; the backend still verifies the token on real requests.
  const isAuthenticated = (await cookies()).has(AUTH_COOKIE_NAME);

  return (
    <>
      <MobileHeader cartCount={cartCount} isAuthenticated={isAuthenticated} />
      <header className="hidden border-b border-line/40 md:block">
        <TopBar />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
          <Link href="/" className="font-serif text-3xl font-black text-brand">
            Arva
          </Link>

          <nav
            aria-label="Account and shopping"
            className="order-2 ml-auto flex items-center gap-1 md:order-3 md:gap-4"
          >
            <NavLink href="/wishlist" label="Wishlist">
              <Heart className="size-4" aria-hidden="true" />
            </NavLink>
            <NavLink href="/cart" label="Cart">
              <ShoppingCart className="size-4" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute right-1 top-1.5 flex size-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-white md:static md:-ml-2 md:-mt-3">
                  <span className="sr-only">{cartCount} items</span>
                  <span aria-hidden="true">{cartCount}</span>
                </span>
              )}
            </NavLink>
            <NavLink href="/profile" label="My Profile">
              <User className="size-4" aria-hidden="true" />
            </NavLink>
          </nav>

          <SearchBar className="order-3 w-full md:order-2 md:w-auto md:max-w-md md:flex-1" />
        </div>
      </header>
    </>
  );
}
