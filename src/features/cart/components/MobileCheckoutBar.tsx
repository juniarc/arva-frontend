import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { formatCurrency } from "@/lib/format";

interface MobileCheckoutBarProps {
  allSelected: boolean;
  total: number;
  selectedCount: number;
  canBuy: boolean;
  onToggleAll: () => void;
  onBuy: () => void;
}

/**
 * Mobile and tablet only: "All" checkbox, the total, and Buy.
 * It is `sticky` as the last item of the page content (not `fixed`), like the product page's action bar:
 * it stays at the bottom of the screen while scrolling, never covers the footer, and needs no
 * extra bottom padding on the content. Safe-area padding keeps it clear of the home indicator.
 */
export function MobileCheckoutBar({
  allSelected,
  total,
  selectedCount,
  canBuy,
  onToggleAll,
  onBuy,
}: MobileCheckoutBarProps) {
  return (
    <div className="sticky bottom-0 z-30 flex items-center gap-3 border-t border-line/40 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_12px_rgb(0_0_0/0.08)] lg:hidden">
      <label className="mr-auto flex items-center gap-1 text-sm md:text-base">
        <Checkbox label="Select all items" checked={allSelected} onChange={onToggleAll} className="-ml-2" />
        All
      </label>

      <div aria-live="polite" className="text-right">
        <p className="text-xs text-muted md:text-sm">Total</p>
        <p className="text-base font-bold md:text-lg">{formatCurrency(total)}</p>
      </div>

      <Button variant="brand" className="w-auto min-w-32 md:min-w-40" disabled={!canBuy} onClick={onBuy}>
        Buy ({selectedCount})
      </Button>
    </div>
  );
}
