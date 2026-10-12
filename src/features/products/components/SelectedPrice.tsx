"use client";

import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { usePurchase } from "./PurchaseProvider";

/** Price of the selected variant with its unit, e.g. "Rp 1.000 / kg". */
export function SelectedPrice() {
  const { variant } = usePurchase();
  const discount =
    variant.originalPrice !== undefined && variant.originalPrice > variant.price
      ? Math.round((1 - variant.price / variant.originalPrice) * 100)
      : 0;

  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-2xl font-bold text-brand">{formatCurrency(variant.price)}</span>
      <span className="text-sm text-ink">/ {variant.unit}</span>
      {discount > 0 && variant.originalPrice !== undefined && (
        <>
          <Badge>-{discount}%</Badge>
          <s className="text-sm text-muted">{formatCurrency(variant.originalPrice)}</s>
        </>
      )}
    </p>
  );
}
