import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

interface MobileCheckoutBarProps {
  /** `draft.summary.total`, as the backend calculated it. */
  total: number;
  canPay: boolean;
  hint: string | null;
  paying: boolean;
  onPay: () => void;
}

/**
 * Mobile and tablet only: the total and Pay Now. It is `sticky` as the last item of the page content
 * (not `fixed`), like the cart's bar: it stays at the bottom of the screen while scrolling, never covers
 * the footer, and needs no extra bottom padding. Safe-area padding keeps it clear of the home indicator.
 */
export function MobileCheckoutBar({ total, canPay, hint, paying, onPay }: MobileCheckoutBarProps) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-line/40 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_12px_rgb(0_0_0/0.08)] lg:hidden">
      {hint && (
        <p id="pay-now-hint-mobile" className="mb-2 text-xs text-muted">
          {hint}
        </p>
      )}
      <div className="flex items-center gap-3">
        <div aria-live="polite" className="mr-auto">
          <p className="text-xs text-muted md:text-sm">Total</p>
          <p className="text-base font-bold md:text-lg">{formatCurrency(total)}</p>
        </div>
        <Button
          variant="brand"
          className="w-auto min-w-36 md:min-w-48"
          disabled={!canPay}
          loading={paying}
          aria-describedby={hint ? "pay-now-hint-mobile" : undefined}
          onClick={onPay}
        >
          Pay Now
        </Button>
      </div>
    </div>
  );
}
