import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

interface ShoppingSummaryProps {
  total: number;
  selectedCount: number;
  canBuy: boolean;
  onBuy: () => void;
}

/** Desktop only: sticky card with the total and the Buy button. */
export function ShoppingSummary({ total, selectedCount, canBuy, onBuy }: ShoppingSummaryProps) {
  return (
    <aside
      aria-labelledby="shopping-summary-title"
      className="hidden self-start rounded-lg border border-line/40 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:block"
    >
      <h2 id="shopping-summary-title" className="font-serif text-2xl font-bold">
        Shopping Summary
      </h2>

      <div aria-live="polite" className="mt-6 flex items-center justify-between">
        <span className="text-sm">Total</span>
        <span className="text-lg font-bold">{formatCurrency(total)}</span>
      </div>

      <Button variant="brand" className="mt-4" disabled={!canBuy} onClick={onBuy}>
        <span aria-live="polite">Buy ({selectedCount})</span>
      </Button>
    </aside>
  );
}
