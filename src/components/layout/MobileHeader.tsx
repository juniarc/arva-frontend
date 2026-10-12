"use client";

import { Menu, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CartDrawer } from "./CartDrawer";
import { MobileMenu } from "./MobileMenu";
import { MobileSearchPanel } from "./MobileSearchPanel";

type Panel = "menu" | "cart" | "search";

/** Matches the drawer slide-out duration (duration-300) so panels never overlap. */
const SLIDE_MS = 300;

const ICON_BUTTON =
  "relative flex size-11 items-center justify-center rounded-sm border border-white text-white " +
  "hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

interface MobileHeaderProps {
  cartCount?: number;
  isAuthenticated: boolean;
}

/** Compact green header for small screens: logo, search, cart, and menu. One panel is open at a time. */
export function MobileHeader({
  cartCount = 0,
  isAuthenticated,
}: MobileHeaderProps) {
  const [active, setActive] = useState<Panel | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  /** Opens `next`. If another panel is open, it closes first and `next` opens after it has slid away. */
  const toggle = (next: Panel) => {
    clearTimeout(timer.current);
    if (active === next) {
      setActive(null);
    } else if (active === null) {
      setActive(next);
    } else {
      setActive(null);
      timer.current = setTimeout(() => setActive(next), SLIDE_MS);
    }
  };

  const closeIfActive = (panel: Panel) => () =>
    setActive((current) => (current === panel ? null : current));

  return (
    <header className="bg-brand md:hidden">
      <div className="flex items-center gap-3 px-4 py-2">
        <Link
          href="/"
          className="mr-auto font-serif text-3xl font-black text-white"
        >
          Arva
        </Link>

        <button
          type="button"
          aria-label="Search"
          aria-expanded={active === "search"}
          onClick={() => toggle("search")}
          className={ICON_BUTTON}
        >
          <Search className="size-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Cart"
          aria-haspopup="dialog"
          onClick={() => toggle("cart")}
          className={ICON_BUTTON}
        >
          <ShoppingBag className="size-5" aria-hidden="true" />
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
              <span className="sr-only">{cartCount} items</span>
              <span aria-hidden="true">{cartCount}</span>
            </span>
          )}
        </button>

        <button
          type="button"
          aria-label="Menu"
          aria-haspopup="dialog"
          onClick={() => toggle("menu")}
          className={ICON_BUTTON}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </div>

      <MobileSearchPanel
        open={active === "search"}
        onClose={closeIfActive("search")}
      />
      <CartDrawer
        open={active === "cart"}
        onClose={closeIfActive("cart")}
        count={cartCount}
      />
      <MobileMenu
        open={active === "menu"}
        onClose={closeIfActive("menu")}
        isAuthenticated={isAuthenticated}
      />
    </header>
  );
}
