"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { CartToast } from "@/features/cart/components/CartToast";
import type { Product } from "../types";
import { AddToCartModal } from "./AddToCartModal";

interface AddToCartButtonProps {
  product: Product;
  /** From `isLoggedIn()` in lib/session.ts. Guests are sent to the login page instead of seeing the modal. */
  isLoggedIn: boolean;
}

/** The icon button on a product card. Logged-in users get the modal; guests go to /login. */
export function AddToCartButton({ product, isLoggedIn }: AddToCartButtonProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleClick = () => {
    if (!isLoggedIn) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?redirect=${encodeURIComponent(here)}`);
      return;
    }
    setOpen(true);
  };

  const handleAdded = () => {
    setToast("Product added to cart.");
    // Re-render the server components so the cart badge and drawer show the new count.
    router.refresh();
  };

  const handleClose = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <span className="relative z-10">
        <IconButton ref={triggerRef} label={`Add ${product.name} to cart`} onClick={handleClick}>
          <ShoppingBag className="size-4" aria-hidden="true" />
        </IconButton>
      </span>

      {open && (
        <AddToCartModal
          product={product}
          onClose={handleClose}
          onAdded={handleAdded}
        />
      )}

      <CartToast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
