import { Heart } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/Checkbox";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatCurrency } from "@/lib/format";
import { isSelectable, maxQuantity } from "../state/cart-selection";
import type { CartItem } from "../types";
import { QuantityStepper } from "./QuantityStepper";

interface CartItemRowProps {
  item: CartItem;
  selected: boolean;
  /** A quantity update is in flight for this item. */
  updating: boolean;
  wishlisted: boolean;
  onToggleSelect: (itemId: string) => void;
  onChangeQuantity: (itemId: string, quantity: number) => void;
  onToggleWishlist: (productId: string) => void;
}

/** One cart item: checkbox, image, name, variant, unit price, heart and quantity stepper. */
export function CartItemRow({
  item,
  selected,
  updating,
  wishlisted,
  onToggleSelect,
  onChangeQuantity,
  onToggleWishlist,
}: CartItemRowProps) {
  const outOfStock = !isSelectable(item);

  return (
    <li className="flex gap-2 py-3 lg:gap-3">
      <Checkbox
        label={`Select item ${item.name}`}
        checked={selected}
        disabled={outOfStock}
        onChange={() => onToggleSelect(item.id)}
        className="-ml-2 self-start lg:ml-0 lg:mt-1"
      />

      <div className="relative size-22 shrink-0 overflow-hidden rounded-md bg-surface md:size-28 lg:size-24">
        <SafeImage src={item.imageUrl} alt="" fill sizes="7rem" className="object-cover" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/products/${item.productSlug}`}
          className="line-clamp-2 text-sm text-ink hover:underline focus-visible:outline-2 focus-visible:outline-info md:text-base lg:text-sm"
        >
          {item.name}
        </Link>
        <p className="mt-1 text-xs text-muted md:text-sm lg:text-xs">{item.variantLabel}</p>
        <p className="mt-1 text-base font-bold md:text-lg lg:text-base">{formatCurrency(item.price)}</p>
        {outOfStock && <p className="mt-1 text-xs font-medium text-danger-strong">Out of stock</p>}

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            onClick={() => onToggleWishlist(item.productId)}
            className="-ml-2 flex size-11 items-center justify-center text-ink focus-visible:outline-2 focus-visible:outline-info lg:ml-0 lg:size-8"
          >
            <Heart className={`size-5 ${wishlisted ? "fill-danger text-danger" : ""}`} aria-hidden="true" />
          </button>

          <QuantityStepper
            value={item.quantity}
            max={maxQuantity(item)}
            disabled={updating}
            removeAtMin
            onChange={(next) => onChangeQuantity(item.id, next)}
          />
        </div>
      </div>
    </li>
  );
}
