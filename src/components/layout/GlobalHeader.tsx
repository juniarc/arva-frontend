import Link from "next/link";
import type { CartPreviewItem } from "@/features/cart/cart-preview";
import { getCategories } from "@/features/products/api/catalog.server";
import { formatCurrency } from "@/lib/format";
import { loadNavbarSession } from "@/lib/navbar/session.loader";
import type { NavbarCart } from "@/lib/navbar/navbar.types";
import { MobileHeader } from "./MobileHeader";
import { NavbarClient } from "./NavbarClient";
import { SearchBar } from "./SearchBar";
import { TopBar } from "./TopBar";

/** The mobile cart drawer's rows. */
function toDrawerItems(cart: NavbarCart): CartPreviewItem[] {
  return cart.items.map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl,
    variant: item.variantLabel,
    quantity: item.quantity,
    price: formatCurrency(item.unitPrice),
  }));
}

/**
 * Site-wide header: utility bar, logo, search, and the Wishlist, Cart, My Shop and profile menus.
 * It loads the session summaries itself on every request (they are personal, so nothing is cached).
 */
export async function GlobalHeader() {
  const [categories, session] = await Promise.all([getCategories(), loadNavbarSession()]);
  const cart = session.kind === "user" ? session.cart : null;

  return (
    <>
      <MobileHeader
        cartCount={cart?.itemCount ?? 0}
        cartItems={cart ? toDrawerItems(cart) : undefined}
        categories={categories}
        session={session}
      />
      <header className="hidden border-b border-line/40 md:block">
        <TopBar />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
          <Link href="/" className="font-serif text-3xl font-black text-brand">
            Arva
          </Link>

          <nav aria-label="Account and shopping" className="order-2 ml-auto md:order-3">
            <NavbarClient session={session} />
          </nav>

          <SearchBar className="order-3 w-full md:order-2 md:w-auto md:max-w-md md:flex-1" />
        </div>
      </header>
    </>
  );
}
