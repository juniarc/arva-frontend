"use client";

import { LogOut, Receipt, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { logout } from "@/features/auth/api/auth";
import type { NavbarUser } from "@/lib/navbar/navbar.types";
import { PANEL } from "./navbar-styles";

/** Order history lives at /orders. */
export const ORDER_HISTORY_HREF = "/orders";

const ITEM =
  "flex min-h-10 w-full items-center gap-3 rounded-sm px-1 text-sm text-ink hover:bg-surface " +
  "focus-visible:outline-2 focus-visible:outline-info";

/** The account menu: who is logged in, My Profile, Order History, and Logout. */
export function ProfileDropdown({ id, open, user }: { id: string; open: boolean; user: NavbarUser }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  // Logout clears the cookie through our own route, then goes to the login page.
  const handleLogout = async () => {
    setFailed(false);
    if (!(await logout())) {
      setFailed(true);
      return;
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <div id={id} role="region" aria-label="Account menu" hidden={!open} className={`${PANEL} w-72`}>
      <div className="flex items-center gap-3 border-b border-line/30 pb-3">
        <Avatar src={user.photoUrl} name={user.username} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{user.username ?? "My Account"}</p>
          {user.email && <p className="truncate text-xs text-muted">{user.email}</p>}
        </div>
      </div>
      <nav aria-label="Account" className="border-b border-line/30 py-2">
        <Link href="/profile" className={ITEM}>
          <User className="size-4" aria-hidden="true" />
          My Profile
        </Link>
        <Link href={ORDER_HISTORY_HREF} className={ITEM}>
          <Receipt className="size-4" aria-hidden="true" />
          Order History
        </Link>
      </nav>
      <button type="button" onClick={() => void handleLogout()} className={`${ITEM} mt-2 text-danger`}>
        <LogOut className="size-4" aria-hidden="true" />
        Logout
      </button>
      {failed && (
        <p role="alert" className="mt-1 text-xs text-danger">
          Could not log out. Please try again.
        </p>
      )}
    </div>
  );
}
