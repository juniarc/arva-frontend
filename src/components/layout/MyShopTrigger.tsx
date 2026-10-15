import { Store } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { truncateName } from "@/lib/navbar/navbar.mapper";
import type { NavbarShop } from "@/lib/navbar/navbar.types";
import { TRIGGER, type TriggerProps } from "./navbar-styles";

interface MyShopTriggerProps extends TriggerProps {
  guest: boolean;
  /** Null when the shop could not be loaded: the default trigger, a link without a preview. */
  shop: NavbarShop | null;
}

function DefaultLabel() {
  return (
    <>
      <Store className="size-4" aria-hidden="true" />
      <span>My Shop</span>
    </>
  );
}

/**
 * Guests go to log in. With no shop, "My Shop" opens the Create Shop panel. With a shop, the trigger
 * shows the shop's logo and name instead of the label.
 */
export function MyShopTrigger({ guest, shop, ...props }: MyShopTriggerProps) {
  if (guest || !shop) {
    return (
      <Link href={guest ? "/login?redirect=%2Fmy-shop" : "/my-shop"} className={TRIGGER}>
        <DefaultLabel />
      </Link>
    );
  }
  const hasShop = shop.status === "shop";
  return (
    <button
      ref={props.triggerRef}
      type="button"
      aria-expanded={props.open}
      aria-controls={props.panelId}
      onClick={props.onToggle}
      className={`${TRIGGER} ${hasShop ? "bg-surface px-2 font-bold" : ""}`}
    >
      {hasShop ? (
        <>
          <Avatar src={shop.logoUrl} name={shop.name} kind="shop" size="sm" decorative />
          <span className="sr-only">My shop: </span>
          <span>{truncateName(shop.name)}</span>
        </>
      ) : (
        <DefaultLabel />
      )}
    </button>
  );
}
