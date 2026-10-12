"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import type { CartPreviewItem } from "@/features/cart/cart-preview";
import { MobileDrawer } from "./MobileDrawer";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Total number of items in the cart. */
  count: number;
  items?: CartPreviewItem[];
}

/** Slide-in cart preview for small screens. */
export function CartDrawer({
  open,
  onClose,
  count,
  items = [],
}: CartDrawerProps) {
  return (
    <MobileDrawer open={open} onClose={onClose} label="Cart">
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Close cart"
          onClick={onClose}
          className="flex size-11 items-center justify-center text-ink focus-visible:outline-2 focus-visible:outline-info"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-baseline gap-2 px-5 pb-3">
        <h2 className="font-serif text-2xl font-bold text-ink">Cart</h2>
        <span className="text-[10px] text-muted">({count})</span>
        <Link
          href="/cart"
          onClick={onClose}
          className="ml-auto flex min-h-11 items-center text-[10px] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-info"
        >
          See
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="border-t border-line/40 px-5 py-6 text-sm text-muted">
          Your cart is empty.
        </p>
      ) : (
        <ul className="overflow-y-auto border-t border-line/40 px-5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 border-b border-line/40 py-3 last:border-b-0"
            >
              <div className="relative size-8 shrink-0 overflow-hidden rounded-sm bg-surface">
                <SafeImage src={item.imageUrl} alt="" fill sizes="2rem" className="object-cover" />
              </div>
              <div className="min-w-0 text-xs">
                <p className="truncate text-ink">{item.name}</p>
                <p className="text-[10px] text-muted">{item.variant}</p>
                <p className="mt-1 font-semibold text-ink">
                  {item.quantity} x {item.price}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </MobileDrawer>
  );
}
