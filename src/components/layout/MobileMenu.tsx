"use client";

import { Globe, Heart, LogOut, Receipt, Store, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/features/auth/api/auth";
import { categoryHref, categoryIcon } from "@/features/products/data/categories";
import type { Category } from "@/features/products/types";
import { MobileDrawer } from "./MobileDrawer";

const ROW =
  "flex min-h-11 w-full items-center gap-3 text-sm text-ink hover:text-brand " +
  "focus-visible:outline-2 focus-visible:outline-info";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  categories: Category[];
  /** Shown in the green header when signed in. Omitted until the backend can return the current user. */
  user?: { username: string; email: string };
}

function Section({ children }: { children: ReactNode }) {
  return <div className="border-t border-ink/80 py-1">{children}</div>;
}

/** Navigation drawer for small screens. */
export function MobileMenu({
  open,
  onClose,
  isAuthenticated,
  categories,
  user,
}: MobileMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (!(await logout())) return;
    onClose();
    router.replace("/login");
    router.refresh();
  };

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

        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-brand">
            <User className="size-8" aria-hidden="true" />
          </span>
          {isAuthenticated ? (
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">
                {user?.username ?? "My Account"}
              </p>
              {user && (
                <p className="truncate text-[10px] font-light">{user.email}</p>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className={`text-base font-semibold hover:underline ${FOCUS_RING}`}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      <nav
        aria-label="Menu"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) onClose();
        }}
        className="flex flex-1 flex-col overflow-y-auto px-6 pt-6"
      >
        <h2 className="mb-3 font-serif text-xl font-bold text-ink">
          Categories
        </h2>
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

        {isAuthenticated && (
          <Section>
            <Link href="/wishlist" className={ROW}>
              <Heart className="size-4 shrink-0" aria-hidden="true" />
              Wishlist
            </Link>
            <Link href="/orders" className={ROW}>
              <Receipt className="size-4 shrink-0" aria-hidden="true" />
              My Orders
            </Link>
          </Section>
        )}

        <Section>
          <Link href="/shop" className={ROW}>
            <Store className="size-4 shrink-0" aria-hidden="true" />
            My Shop
          </Link>
        </Section>

        <Section>
          <Link href={isAuthenticated ? "/profile" : "/login"} className={ROW}>
            <User className="size-4 shrink-0" aria-hidden="true" />
            {isAuthenticated ? "My Profile" : "Sign In"}
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

      {isAuthenticated && (
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
