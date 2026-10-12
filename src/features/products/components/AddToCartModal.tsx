"use client";

import { Minus, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import { addToCart } from "@/features/cart/api/add-to-cart";
import { formatCurrency } from "@/lib/format";
import type { Product } from "../types";

interface AddToCartModalProps {
  product: Product;
  /** Called after the native dialog has closed (X, overlay, Escape, or after adding). */
  onClose: () => void;
  /** Called when the product was added, just before the modal closes. */
  onAdded: () => void;
}

const STEPPER_BUTTON =
  "flex size-11 items-center justify-center text-ink hover:bg-surface focus-visible:outline-2 " +
  "focus-visible:outline-info disabled:cursor-not-allowed disabled:opacity-40 md:size-8";

/**
 * Add-to-cart dialog. It is a native <dialog> opened with showModal(), which gives a focus trap,
 * a backdrop and Escape handling. Mount it only while it is open: its state then resets every time.
 * Below 768px it is a bottom sheet; from 768px up it is a centered card.
 */
export function AddToCartModal({ product, onClose, onAdded }: AddToCartModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const firstInStock = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstInStock.id);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variant = product.variants.find((item) => item.id === variantId) ?? firstInStock;
  const outOfStock = variant.stock === 0;
  const total = variant.price * quantity;

  useEffect(() => {
    dialogRef.current?.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const close = () => dialogRef.current?.close();

  const selectVariant = (id: string) => {
    const next = product.variants.find((item) => item.id === id);
    if (!next) return;
    setVariantId(id);
    // Keep the quantity within the new variant's stock.
    setQuantity((current) => Math.max(1, Math.min(current, next.stock)));
    setError(null);
  };

  const handleAdd = async () => {
    setSubmitting(true);
    setError(null);

    const result = await addToCart({ productId: product.id, variantId: variant.id, quantity });
    if (!result.ok) {
      setError(result.message);
      setSubmitting(false);
      return;
    }

    onAdded();
    close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onClose={onClose}
      onClick={(event) => {
        // The dialog has no padding, so a click that lands on the dialog itself is on the backdrop.
        if (event.target === event.currentTarget) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none animate-sheet-up flex-col rounded-t-xl bg-white p-0 text-ink backdrop:animate-fade-in backdrop:bg-black/50 open:flex max-h-[90dvh] motion-reduce:animate-none motion-reduce:backdrop:animate-none md:inset-0 md:m-auto md:max-w-105 md:animate-fade-in md:rounded-xl"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute right-1 top-1 z-10 flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-info"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex gap-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-surface md:size-24">
            <SafeImage src={product.imageUrl} alt="" fill sizes="6rem" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1 pr-8">
            <p className="text-[10px] text-muted">{product.categoryName}</p>
            <h2 id={titleId} className="line-clamp-2 text-sm">
              {product.name}
            </h2>
            <p className="mt-2">
              <span className="font-bold text-brand">{formatCurrency(variant.price)}</span>
              <span className="text-xs text-muted"> / {variant.unit}</span>
            </p>
            <p className="mt-1 text-[10px]">
              Stock : {variant.stock} {variant.unit}
            </p>
          </div>
        </div>

        <hr className="my-4 border-line/40" />

        <section>
          <h3 className="text-sm font-bold">Variants</h3>
          <div role="group" aria-label="Variants" className="mt-3 flex flex-wrap gap-2">
            {product.variants.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === variant.id}
                onClick={() => selectVariant(item.id)}
                className={`min-h-11 rounded-sm px-3 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info md:min-h-8 ${
                  item.id === variant.id ? "bg-mint font-medium text-brand" : "bg-chip text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {outOfStock && <p className="mt-2 text-xs font-medium text-danger-strong">Out of stock</p>}
        </section>

        <hr className="my-4 border-line/40" />

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Quantity</h3>
          <div className="flex items-center rounded-sm border border-line">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((current) => current - 1)}
              disabled={quantity <= 1}
              className={STEPPER_BUTTON}
            >
              <Minus className="size-3" aria-hidden="true" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              readOnly
              aria-label="Quantity"
              value={quantity}
              className="h-11 w-10 border-x border-line text-center text-xs outline-none md:h-8"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((current) => current + 1)}
              disabled={quantity >= variant.stock}
              className={STEPPER_BUTTON}
            >
              <Plus className="size-3" aria-hidden="true" />
            </button>
          </div>
        </div>

        <hr className="my-4 border-line/40" />

        <div className="flex items-center justify-end gap-4 text-sm font-bold">
          <span>Total</span>
          <span aria-live="polite">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:px-6 md:pb-6">
        {error && <Alert variant="error" message={error} />}
        <Button variant="brand" loading={submitting} disabled={outOfStock} onClick={handleAdd}>
          Add To Chart
        </Button>
      </div>
    </dialog>
  );
}
