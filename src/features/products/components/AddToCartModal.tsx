"use client";

import { Minus, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import { addToCart } from "@/features/cart/api/add-to-cart";
import { buyNow } from "@/features/checkout/api/buy-now";
import { formatCurrency } from "@/lib/format";
import { fetchProductDetail } from "../api/products";
import type { Product, ProductDetail } from "../types";

interface AddToCartModalProps {
  /** The card's product. Its name, image and lowest price show while the variants load. */
  product: Product;
  /** Called after the native dialog has closed (X, overlay, Escape, or after adding). */
  onClose: () => void;
  /** Called when the product was added, just before the modal closes. Not called in buy-now mode. */
  onAdded: () => void;
  /** "buy-now" changes the main button to "Buy Now" and runs the buy-now action instead of adding to the cart. */
  mode?: "add" | "buy-now";
  /** When the caller already has the variants (the product page), the modal skips loading them. */
  initialDetail?: ProductDetail;
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; detail: ProductDetail };

const STEPPER_BUTTON =
  "flex size-11 items-center justify-center text-ink hover:bg-surface focus-visible:outline-2 " +
  "focus-visible:outline-info disabled:cursor-not-allowed disabled:opacity-40 md:size-8";

/**
 * Add-to-cart dialog. It is a native <dialog> opened with showModal(), which gives a focus trap,
 * a backdrop and Escape handling. Mount it only while it is open: its state then resets every time.
 * Below 768px it is a bottom sheet; from 768px up it is a centered card.
 * The variants are not part of the card data, so they are loaded when the modal opens.
 */
export function AddToCartModal({ product, onClose, onAdded, mode = "add", initialDetail }: AddToCartModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const [load, setLoad] = useState<LoadState>(
    initialDetail ? { status: "ready", detail: initialDetail } : { status: "loading" },
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detail = load.status === "ready" ? load.detail : undefined;
  const variant = detail
    ? (detail.variants.find((item) => item.id === selectedId) ??
      detail.variants.find((item) => item.stock > 0) ??
      detail.variants[0])
    : undefined;
  const outOfStock = variant?.stock === 0;

  useEffect(() => {
    dialogRef.current?.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (initialDetail) return;
    let cancelled = false;
    setLoad({ status: "loading" });

    fetchProductDetail(product.slug).then((result) => {
      if (cancelled) return;
      setLoad(result.ok ? { status: "ready", detail: result.product } : { status: "error", message: result.message });
    });

    return () => {
      cancelled = true;
    };
  }, [product.slug, reloadKey, initialDetail]);

  const close = () => dialogRef.current?.close();

  const selectVariant = (id: string) => {
    const next = detail?.variants.find((item) => item.id === id);
    if (!next) return;
    setSelectedId(id);
    // Keep the quantity within the new variant's stock.
    setQuantity((current) => Math.max(1, Math.min(current, next.stock)));
    setError(null);
  };

  const handleAdd = async () => {
    if (!variant) return;
    setSubmitting(true);
    setError(null);

    const input = { variantId: variant.id, quantity };
    const result = mode === "buy-now" ? await buyNow(input) : await addToCart(input);
    if (!result.ok) {
      setError(result.message);
      setSubmitting(false);
      return;
    }

    if (mode === "add") onAdded();
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
              <span className="font-bold text-brand">{formatCurrency(variant?.price ?? product.price)}</span>
              {variant && <span className="text-xs text-muted"> / {variant.unit}</span>}
            </p>
            {variant && (
              <p className="mt-1 text-[10px]">
                Stock : {variant.stock} {variant.unit}
              </p>
            )}
          </div>
        </div>

        <hr className="my-4 border-line/40" />

        {load.status === "loading" && (
          <p role="status" className="py-6 text-center text-xs text-muted">
            Loading variants...
          </p>
        )}

        {load.status === "error" && (
          <div className="flex flex-col items-start gap-3 py-2">
            <Alert variant="error" message={load.message} className="w-full" />
            <Button variant="outline" className="w-auto" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </Button>
          </div>
        )}

        {detail && variant && (
          <>
            <section>
              <h3 className="text-sm font-bold">Variants</h3>
              <div role="group" aria-label="Variants" className="mt-3 flex flex-wrap gap-2">
                {detail.variants.map((item) => (
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
              <span aria-live="polite">{formatCurrency(variant.price * quantity)}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:px-6 md:pb-6">
        {error && <Alert variant="error" message={error} />}
        <Button variant="brand" loading={submitting} disabled={!variant || outOfStock} onClick={handleAdd}>
          {mode === "buy-now" ? "Buy Now" : "Add To Chart"}
        </Button>
      </div>
    </dialog>
  );
}
