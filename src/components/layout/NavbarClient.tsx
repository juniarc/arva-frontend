"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { NavbarSession } from "@/lib/navbar/navbar.types";
import { CartDropdown } from "./CartDropdown";
import { CartTrigger } from "./CartTrigger";
import { MyShopDropdown } from "./MyShopDropdown";
import { MyShopTrigger } from "./MyShopTrigger";
import { ProfileDropdown } from "./ProfileDropdown";
import { ProfileTrigger } from "./ProfileTrigger";
import { TRIGGER } from "./navbar-styles";

type MenuId = "cart" | "shop" | "profile";

/**
 * The desktop navbar's links and dropdowns. One dropdown is open at a time. It closes on a click
 * outside, on Escape (focus goes back to its trigger), on a link inside it, and on navigation.
 */
export function NavbarClient({ session }: { session: NavbarSession }) {
  const [open, setOpen] = useState<MenuId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggers = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({});
  const pathname = usePathname();

  useEffect(() => setOpen(null), [pathname]);

  useEffect(() => {
    if (!open) return;
    const clickOutside = (event: globalThis.MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(null);
      triggers.current[open]?.focus();
    };
    document.addEventListener("mousedown", clickOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", clickOutside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const bind = (id: MenuId) => ({
    open: open === id,
    onToggle: () => setOpen((current) => (current === id ? null : id)),
    panelId: `navbar-${id}-panel`,
    triggerRef: (element: HTMLButtonElement | null) => {
      triggers.current[id] = element;
    },
  });

  // A link inside a dropdown closes it, even when it points at the page already open.
  const closeOnLink = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a")) setOpen(null);
  };

  const user = session.kind === "user" ? session : null;
  const guest = user === null;

  return (
    <div ref={rootRef} onClick={closeOnLink} className="flex items-center gap-1 lg:gap-3">
      <Link href="/wishlist" className={TRIGGER}>
        <Heart className="size-4" aria-hidden="true" />
        <span>Wishlist</span>
      </Link>

      <div className="relative">
        <CartTrigger count={user?.cart?.itemCount ?? 0} guest={guest} {...bind("cart")} />
        {user && <CartDropdown id={bind("cart").panelId} open={open === "cart"} cart={user.cart} />}
      </div>

      <span aria-hidden="true" className="mx-1 h-6 w-px bg-line/50" />

      <div className="relative">
        <MyShopTrigger guest={guest} shop={user?.shop ?? null} {...bind("shop")} />
        {user?.shop && <MyShopDropdown id={bind("shop").panelId} open={open === "shop"} shop={user.shop} />}
      </div>

      <div className="relative">
        <ProfileTrigger user={user?.user ?? null} {...bind("profile")} />
        {user && <ProfileDropdown id={bind("profile").panelId} open={open === "profile"} user={user.user} />}
      </div>
    </div>
  );
}
