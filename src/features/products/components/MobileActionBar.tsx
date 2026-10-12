"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePurchase } from "./PurchaseProvider";
import { WishlistButton } from "./WishlistButton";

/**
 * Mobile and tablet only: wishlist, Buy Now and Add To Cart. Both buttons open the modal.
 * It is `sticky` as the last item of the page content (not `fixed`), so it stays at the bottom of
 * the screen while scrolling but never covers the footer at the end of the page.
 */
export function MobileActionBar() {
  const { allOutOfStock, openModal } = usePurchase();

  return (
    <div className="sticky bottom-0 z-30 flex items-center gap-3 border-t border-line/40 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg lg:hidden">
      <WishlistButton />
      <Button
        variant="brand-outline"
        className="flex-1 font-sans"
        disabled={allOutOfStock}
        onClick={() => openModal("buy-now")}
      >
        Buy Now
      </Button>
      <Button variant="brand" className="flex-1 font-sans" disabled={allOutOfStock} onClick={() => openModal("add")}>
        <ShoppingBag className="size-4" aria-hidden="true" />
        {allOutOfStock ? "Out of stock" : "Add To Cart"}
      </Button>
    </div>
  );
}
