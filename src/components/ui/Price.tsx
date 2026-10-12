import { formatCurrency } from "@/lib/format";
import { Badge } from "./Badge";

interface PriceProps {
  amount: number;
  originalAmount?: number;
  discountPercent?: number;
}

/** Bold price. With a discount it also shows the red badge and the struck-through original price. */
export function Price({ amount, originalAmount, discountPercent }: PriceProps) {
  const hasDiscount = discountPercent !== undefined && discountPercent > 0;

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="text-sm font-bold text-brand">{formatCurrency(amount)}</span>
      {hasDiscount && <Badge>-{discountPercent}%</Badge>}
      {hasDiscount && originalAmount !== undefined && (
        <s className="text-xs text-muted">{formatCurrency(originalAmount)}</s>
      )}
    </p>
  );
}
