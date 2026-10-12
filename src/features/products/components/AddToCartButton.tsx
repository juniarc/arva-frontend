"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { IconButton } from "@/components/ui/IconButton";
import type { Product } from "../types";
import { AddToCartModal } from "./AddToCartModal";

const TOAST_MS = 3000;

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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleClick = () => {
    if (!isLoggedIn) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?redirect=${encodeURIComponent(here)}`);
      return;
    }
    setOpen(true);
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
          onAdded={() => setToast("Product added to cart.")}
        />
      )}

      {toast &&
        createPortal(
          <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-7xl p-4">
            <Alert variant="success" message={toast} onClose={() => setToast(null)} />
          </div>,
          document.body,
        )}
    </>
  );
}
