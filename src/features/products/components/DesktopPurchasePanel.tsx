"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { usePurchase } from "./PurchaseProvider";
import { WishlistButton } from "./WishlistButton";

/** Show "Only N left" when the selected variant has fewer than this many units. */
const LOW_STOCK_BELOW = 10;

const STEPPER_BUTTON =
  "flex size-8 items-center justify-center text-ink hover:bg-surface focus-visible:outline-2 " +
  "focus-visible:outline-info disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Desktop only (1024px and up): variants, quantity, total and actions inline in a mint card.
 * On mobile and tablet the same choices are made inside the AddToCartModal.
 */
export function DesktopPurchasePanel() {
  const { product, variant, selectVariant, quantity, changeQuantity, allOutOfStock, submit, submitting, error } =
    usePurchase();
  const soldOut = variant.stock === 0;

  return (
    <section aria-label="Purchase options" className="hidden rounded-md bg-mint p-5 lg:block">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="w-20 text-sm font-bold">Variants</p>
        <div role="group" aria-label="Variants" className="flex flex-wrap gap-2">
          {product.variants.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === variant.id}
              onClick={() => selectVariant(item.id)}
              className={`min-h-8 rounded-sm px-3 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info ${
                item.id === variant.id ? "bg-brand font-medium text-white" : "border border-line bg-white text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {soldOut && <p className="mt-2 text-xs font-medium text-danger-strong">Out of stock</p>}
      {!soldOut && variant.stock < LOW_STOCK_BELOW && (
        <p className="mt-2 text-xs font-medium text-danger-strong">Only {variant.stock} left</p>
      )}

      <div className="mt-4 flex items-center gap-x-6">
        <p className="w-20 text-sm font-bold">Quantity</p>
        <div className="flex items-center rounded-sm border border-line bg-white">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => changeQuantity(quantity - 1)}
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
            className="h-8 w-10 border-x border-line bg-white text-center text-xs outline-none"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => changeQuantity(quantity + 1)}
            disabled={quantity >= variant.stock}
            className={STEPPER_BUTTON}
          >
            <Plus className="size-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      <hr className="my-4 border-ink/70" />

      <div className="flex items-center gap-6 text-base font-bold">
        <span className="w-20">Total</span>
        <span aria-live="polite">{formatCurrency(variant.price * quantity)}</span>
      </div>

      {error && <Alert variant="error" message={error} className="mt-4" />}

      <div className="mt-4 flex items-center gap-3">
        <WishlistButton />
        <Button
          variant="brand-outline"
          className="w-auto flex-1 font-sans"
          disabled={allOutOfStock || soldOut}
          loading={submitting === "buy-now"}
          onClick={() => submit("buy-now")}
        >
          Buy Now
        </Button>
        <Button
          variant="brand"
          className="w-auto flex-1 font-sans"
          disabled={soldOut}
          loading={submitting === "add"}
          onClick={() => submit("add")}
        >
          <ShoppingBag className="size-4" aria-hidden="true" />
          {soldOut ? "Out of stock" : "Add To Cart"}
        </Button>
      </div>
    </section>
  );
}
