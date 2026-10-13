"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { AddToCartModal } from "@/features/products/components/AddToCartModal";
import { CartToast } from "@/features/cart/components/CartToast";
import type { Product } from "@/features/products/types";
import { useWishlistState } from "../state/useWishlistState";
import type { WishlistData } from "../types";
import { RemoveWishlistDialog } from "./RemoveWishlistDialog";
import { WishlistEmpty } from "./WishlistEmpty";
import { WishlistGrid } from "./WishlistGrid";
import { WishlistHeader } from "./WishlistHeader";

/** The wishlist screen. One component tree for every screen size; only the back bar and grid columns change. */
export function WishlistPage({ initialWishlist }: { initialWishlist: WishlistData }) {
  const router = useRouter();
  const wishlist = useWishlistState(initialWishlist);
  const [cartProduct, setCartProduct] = useState<Product | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);

  return (
    <div className="pb-10">
      <WishlistHeader />

      <div className="mx-auto max-w-300 px-4 lg:px-6">
        <h1 className="py-4 font-serif text-2xl font-bold text-brand md:text-3xl lg:pt-8">Wishlist Products</h1>

        {wishlist.notice && (
          <Alert
            variant={wishlist.notice.variant}
            message={wishlist.notice.message}
            onClose={wishlist.dismissNotice}
            className="mb-4"
          />
        )}

        {wishlist.items.length === 0 ? (
          <WishlistEmpty />
        ) : (
          <WishlistGrid items={wishlist.items} onRemove={wishlist.requestRemove} onAddToCart={setCartProduct} />
        )}
      </div>

      <RemoveWishlistDialog
        open={wishlist.dialogOpen}
        count={1}
        removing={wishlist.removing}
        onConfirm={wishlist.confirmRemove}
        onClose={wishlist.cancelRemove}
      />

      {cartProduct && (
        <AddToCartModal
          product={cartProduct}
          onClose={() => setCartProduct(null)}
          onAdded={() => {
            // The item stays in the wishlist. Only the cart badge and drawer need to update.
            setCartToast("Product added to cart.");
            router.refresh();
          }}
        />
      )}
      <CartToast message={cartToast} onDismiss={() => setCartToast(null)} />
    </div>
  );
}
