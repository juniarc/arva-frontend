"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { addToCart } from "@/features/cart/api/add-to-cart";
import { CartToast } from "@/features/cart/components/CartToast";
import { buyNow } from "@/features/checkout/api/buy-now";
import { addToWishlist, removeFromWishlist } from "@/features/wishlist/api/wishlist.client";
import type { ProductDetail, ProductVariant } from "../types";
import { PLACEHOLDER_IMAGE } from "@/components/ui/SafeImage";
import { AddToCartModal } from "./AddToCartModal";

export type PurchaseMode = "add" | "buy-now";

interface PurchaseState {
  product: ProductDetail;
  variant: ProductVariant;
  selectVariant: (id: string) => void;
  quantity: number;
  changeQuantity: (next: number) => void;
  /** True when no variant has any stock left. */
  allOutOfStock: boolean;
  wishlisted: boolean;
  toggleWishlist: () => Promise<void>;
  /** Mobile and tablet: opens the modal, where the variant and quantity are chosen. */
  openModal: (mode: PurchaseMode) => void;
  /** Desktop: runs the action with the inline selection. */
  submit: (mode: PurchaseMode) => Promise<void>;
  submitting: PurchaseMode | null;
  error: string | null;
}

const PurchaseContext = createContext<PurchaseState | null>(null);

export function usePurchase(): PurchaseState {
  const state = useContext(PurchaseContext);
  if (!state) throw new Error("usePurchase must be used inside <PurchaseProvider>.");
  return state;
}

interface PurchaseProviderProps {
  product: ProductDetail;
  /** From `isLoggedIn()` in lib/session.ts. Guests are sent to the login page instead. */
  isLoggedIn: boolean;
  /** The wishlist entry id when this product is already saved. Loaded on the server. */
  initialWishlistItemId?: string;
  children: ReactNode;
}

/**
 * Holds what the shopper has chosen on the product page (variant, quantity, wishlist) and runs the
 * actions, so the price, the desktop panel, the mobile bar and the modal always agree.
 */
export function PurchaseProvider({ product, isLoggedIn, initialWishlistItemId, children }: PurchaseProviderProps) {
  const router = useRouter();
  const opener = useRef<HTMLElement | null>(null);

  const [variantId, setVariantId] = useState(product.defaultVariantId);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(initialWishlistItemId !== undefined);
  /** DELETE takes the wishlist entry id, which the server gives us when the product is added. */
  const wishlistItemId = useRef(initialWishlistItemId);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [modal, setModal] = useState<PurchaseMode | null>(null);
  const [submitting, setSubmitting] = useState<PurchaseMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const allOutOfStock = product.variants.every((item) => item.stock === 0);

  /** Guests cannot use the cart or wishlist. Returns false after sending them to the login page. */
  const requireLogin = (): boolean => {
    if (isLoggedIn) return true;
    const here = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(here)}`);
    return false;
  };

  const clampQuantity = (value: number, stock: number) => Math.max(1, Math.min(value, stock));

  const selectVariant = (id: string) => {
    const next = product.variants.find((item) => item.id === id);
    if (!next) return;
    setVariantId(id);
    setQuantity((current) => clampQuantity(current, next.stock));
    setError(null);
  };

  const changeQuantity = (next: number) => setQuantity(clampQuantity(next, variant.stock));

  /** Optimistic: the heart changes at once, and goes back if the server says no. */
  const toggleWishlist = async () => {
    if (!requireLogin() || wishlistBusy) return;

    const adding = !wishlisted;
    const entryId = wishlistItemId.current;
    setWishlisted(adding);
    setWishlistBusy(true);

    const result = adding
      ? await addToWishlist(product.id)
      : entryId !== undefined
        ? await removeFromWishlist([entryId])
        : undefined;
    setWishlistBusy(false);

    if (result && !result.ok) {
      setWishlisted(!adding);
      setToast({ message: result.message, variant: "error" });
      return;
    }

    wishlistItemId.current = adding ? result?.wishlist.items.find((item) => item.product.id === product.id)?.id : undefined;
    setToast({ message: adding ? "Added to wishlist." : "Removed from wishlist.", variant: "success" });
  };

  const openModal = (mode: PurchaseMode) => {
    if (!requireLogin()) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setModal(mode);
  };

  const handleAdded = () => {
    setToast({ message: "Product added to cart.", variant: "success" });
    // Re-render the server components so the cart badge and drawer show the new count.
    router.refresh();
  };

  const submit = async (mode: PurchaseMode) => {
    if (!requireLogin() || variant.stock === 0) return;

    setSubmitting(mode);
    setError(null);
    const input = { variantId: variant.id, quantity };
    const result = mode === "buy-now" ? await buyNow(input) : await addToCart(input);
    setSubmitting(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (mode === "add") handleAdded();
  };

  const value: PurchaseState = {
    product,
    variant,
    selectVariant,
    quantity,
    changeQuantity,
    allOutOfStock,
    wishlisted,
    toggleWishlist,
    openModal,
    submit,
    submitting,
    error,
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}

      {modal && (
        <AddToCartModal
          product={{
            slug: product.slug,
            name: product.name,
            categoryName: product.categoryName,
            imageUrl: product.images[0]?.url ?? PLACEHOLDER_IMAGE,
            price: variant.price,
          }}
          initialDetail={product}
          mode={modal}
          onAdded={handleAdded}
          onClose={() => {
            setModal(null);
            opener.current?.focus();
          }}
        />
      )}

      <CartToast message={toast?.message ?? null} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </PurchaseContext.Provider>
  );
}
