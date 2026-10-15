import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { BADGE, TRIGGER, type TriggerProps } from "./navbar-styles";

function CartLabel({ count }: { count: number }) {
  return (
    <>
      <ShoppingCart className="size-4" aria-hidden="true" />
      <span>Cart</span>
      {count > 0 && (
        <span aria-hidden="true" className={BADGE}>
          {count}
        </span>
      )}
    </>
  );
}

/** "Cart, 3 items" for screen readers; just "Cart" when it is empty. */
export function cartLabel(count: number): string {
  return count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";
}

/** A guest goes to log in; a logged-in user opens the cart preview. */
export function CartTrigger({ count, guest, ...props }: { count: number; guest: boolean } & TriggerProps) {
  if (guest) {
    return (
      <Link href="/login?redirect=%2Fcart" aria-label={cartLabel(0)} className={TRIGGER}>
        <CartLabel count={0} />
      </Link>
    );
  }
  return (
    <button
      ref={props.triggerRef}
      type="button"
      aria-label={cartLabel(count)}
      aria-expanded={props.open}
      aria-controls={props.panelId}
      onClick={props.onToggle}
      className={TRIGGER}
    >
      <CartLabel count={count} />
    </button>
  );
}
