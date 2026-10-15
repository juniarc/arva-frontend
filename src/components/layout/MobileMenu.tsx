"use client";

import { Globe, Heart, LogOut, Receipt, ShoppingCart, Store, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { logout } from "@/features/auth/api/auth";
import { categoryHref, categoryIcon } from "@/features/products/data/categories";
import type { Category } from "@/features/products/types";
import type { NavbarSession } from "@/lib/navbar/navbar.types";
import { ORDER_HISTORY_HREF } from "./ProfileDropdown";
import { MobileDrawer } from "./MobileDrawer";

const ROW =
  "flex min-h-11 w-full items-center gap-3 text-sm text-ink hover:text-brand " +
  "focus-visible:outline-2 focus-visible:outline-info";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  session: NavbarSession;
}

function Section({ children }: { children: ReactNode }) {
  return <div className="border-t border-ink/80 py-1">{children}</div>;
}

/** A guest is sent to log in first, and comes back to `href` afterwards. */
function forGuest(href: string, guest: boolean): string {
  return guest ? `/login?redirect=${encodeURIComponent(href)}` : href;
}

/** Navigation drawer for small screens. */
export function MobileMenu({ open, onClose, categories, session }: MobileMenuProps) {
  const router = useRouter();
  const user = session.kind === "user" ? session : null;
  const guest = user === null;
  const shop = user?.shop ?? null;
  const cartCount = user?.cart?.itemCount ?? 0;

  const handleLogout = async () => {
    if (!(await logout())) return;
    onClose();
    router.replace("/login");
    router.refresh();
  };

  // My Shop: no shop opens Create Shop, a shop opens its page, and unknown goes to /my-shop to find out.
  const shopLink =
    shop?.status === "none"
      ? { href: "/my-shop/create", label: "Create Shop" }
      : shop?.status === "shop"
        ? { href: `/shops/${shop.slug}`, label: shop.name }
        : { href: forGuest("/my-shop", guest), label: "My Shop" };

  return (
    <MobileDrawer open={open} onClose={onClose} label="Navigation menu">
      <div className="relative bg-brand px-6 pb-6 pt-12 text-white">
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className={`absolute right-1 top-1 flex size-11 items-center justify-center ${FOCUS_RING}`}
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        {user ? (
          <Link href="/profile" onClick={onClose} className={`flex items-center gap-4 ${FOCUS_RING}`}>
            <Avatar src={user.user.photoUrl} name={user.user.username} size="lg" className="bg-white" />
            <span className="min-w-0">
              <span className="block truncate text-base font-bold">{user.user.username ?? "My Account"}</span>
              {user.user.email && <span className="block truncate text-xs font-light">{user.user.email}</span>}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <Avatar src={null} name={null} size="lg" className="bg-white" />
            <div className="min-w-0">
              <p className="text-sm">Log in to continue</p>
              <Link href="/login" onClick={onClose} className={`text-base font-bold underline ${FOCUS_RING}`}>
                Login
              </Link>
            </div>
          </div>
        )}
      </div>

      <nav
        aria-label="Menu"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) onClose();
        }}
        className="flex flex-1 flex-col overflow-y-auto px-6 pt-6"
      >
        <h2 className="mb-3 font-serif text-xl font-bold text-ink">Categories</h2>
        <Section>
          <ul>
            {categories.map(({ id, name, slug, iconKey }) => {
              const Icon = categoryIcon(iconKey);
              return (
                <li key={id}>
                  <Link href={categoryHref(slug)} className={ROW}>
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section>
          <Link href={shopLink.href} className={ROW}>
            <Store className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{shopLink.label}</span>
          </Link>
          <Link href={forGuest("/wishlist", guest)} className={ROW}>
            <Heart className="size-4 shrink-0" aria-hidden="true" />
            Wishlist
          </Link>
          <Link href={forGuest("/cart", guest)} className={ROW}>
            <ShoppingCart className="size-4 shrink-0" aria-hidden="true" />
            Cart
            {cartCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
                <span className="sr-only">, </span>
                {cartCount}
                <span className="sr-only"> {cartCount === 1 ? "item" : "items"}</span>
              </span>
            )}
          </Link>
          <Link href={forGuest("/profile", guest)} className={ROW}>
            <User className="size-4 shrink-0" aria-hidden="true" />
            My Profile
          </Link>
          <Link href={forGuest(ORDER_HISTORY_HREF, guest)} className={ROW}>
            <Receipt className="size-4 shrink-0" aria-hidden="true" />
            Order History
          </Link>
        </Section>

        <Section>
          {/* UI only: translations are not built yet. */}
          <p className="flex min-h-11 items-center gap-3 text-sm text-ink">
            <Globe className="size-4 shrink-0" aria-hidden="true" />
            <span>
              Language ( <strong>EN</strong> )
            </span>
          </p>
        </Section>
      </nav>

      {user && (
        <div className="px-6 pb-6 pt-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 items-center gap-3 text-sm text-danger hover:underline focus-visible:outline-2 focus-visible:outline-info"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Logout
          </button>
        </div>
      )}
    </MobileDrawer>
  );
}
