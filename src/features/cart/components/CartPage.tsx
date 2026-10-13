"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { useCartState } from "../state/useCartState";
import type { CartData } from "../types";
import { CartHeader } from "./CartHeader";
import { ClearConfirmDialog } from "./ClearConfirmDialog";
import { EmptyCart } from "./EmptyCart";
import { MobileCheckoutBar } from "./MobileCheckoutBar";
import { SelectAllRow } from "./SelectAllRow";
import { ShopGroup } from "./ShopGroup";
import { ShoppingSummary } from "./ShoppingSummary";

/**
 * The cart screen. One component tree for every screen size: the pieces that differ
 * (summary card, bottom bar, back bar) are shown or hidden with Tailwind's `lg:` classes.
 */
export function CartPage({ initialCart }: { initialCart: CartData }) {
  const cart = useCartState(initialCart);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    await cart.clearSelected();
    setConfirmOpen(false);
  };

  const notice = cart.notice && (
    <div className="px-4 py-2 lg:px-0">
      <Alert variant={cart.notice.variant} message={cart.notice.message} onClose={cart.dismissNotice} />
    </div>
  );

  return (
    <div className="mx-auto max-w-300 lg:px-6 lg:py-8">
      <h1 className="sr-only">Cart</h1>

      {cart.items.length === 0 ? (
        <>
          {notice}
          <EmptyCart />
        </>
      ) : (
        <>
          <div className="lg:grid lg:grid-cols-[minmax(0,65fr)_minmax(0,30fr)] lg:justify-between lg:gap-8">
            <div>
              <div className="sticky top-0 z-20 bg-white lg:static">
                <CartHeader />
                <SelectAllRow
                  itemCount={cart.itemCount}
                  selectedCount={cart.selectedCount}
                  allSelected={cart.allSelected}
                  onToggleAll={cart.toggleAll}
                  onClear={() => setConfirmOpen(true)}
                />
                {notice}
              </div>

              <div className="px-4 lg:px-0">
                {cart.groups.map((group) => (
                  <ShopGroup
                    key={group.shop.key}
                    group={group}
                    selected={cart.selected}
                    updating={cart.updating}
                    wishlisted={cart.wishlisted}
                    onToggleShop={cart.toggleShop}
                    onToggleItem={cart.toggleItem}
                    onChangeQuantity={cart.changeQuantity}
                    onToggleWishlist={cart.toggleWishlist}
                  />
                ))}
              </div>
            </div>

            <ShoppingSummary
              total={cart.total}
              selectedCount={cart.selectedCount}
              canBuy={cart.canBuy}
              onBuy={cart.buy}
            />
          </div>

          <MobileCheckoutBar
            allSelected={cart.allSelected}
            total={cart.total}
            selectedCount={cart.selectedCount}
            canBuy={cart.canBuy}
            onToggleAll={cart.toggleAll}
            onBuy={cart.buy}
          />
        </>
      )}

      <ClearConfirmDialog
        open={confirmOpen}
        count={cart.selectedCount}
        busy={cart.clearing}
        onConfirm={handleConfirm}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
