"use client";

import { Heart } from "lucide-react";
import { usePurchase } from "./PurchaseProvider";

/** Square heart button. Filled red when the product is wishlisted. */
export function WishlistButton() {
  const { wishlisted, toggleWishlist } = usePurchase();

  return (
    <button
      type="button"
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      onClick={toggleWishlist}
      className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-line bg-white text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
    >
      <Heart className={`size-5 ${wishlisted ? "fill-danger text-danger" : ""}`} aria-hidden="true" />
    </button>
  );
}
