import { Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import type { Draft } from "../types";

interface ShoppingSummaryProps {
  draft: Draft;
  canPay: boolean;
  /** What is still missing, or null. */
  hint: string | null;
  paying: boolean;
  onPay: () => void;
  /** Desktop shows the card with the Pay Now button. Mobile shows the card only (the bottom bar pays). */
  showPayButton: boolean;
  className?: string;
}

function Line({ label, value, info, green }: { label: string; value: string; info?: boolean; green?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <dt className="flex items-center gap-1 text-muted">
        {label}
        {info && <Info className="size-3.5" aria-label={`About ${label}`} role="img" />}
      </dt>
      <dd className={`font-bold ${green ? "text-brand" : ""}`}>{value}</dd>
    </div>
  );
}

/**
 * Every amount here is read from `draft.summary`: the backend calculated it.
 * Nothing is added, subtracted or rounded in the browser (only formatted as "Rp 1.000").
 */
export function ShoppingSummary({ draft, canPay, hint, paying, onPay, showPayButton, className = "" }: ShoppingSummaryProps) {
  const { summary } = draft;

  return (
    <section aria-labelledby={`summary-title-${showPayButton ? "desktop" : "mobile"}`} className={`rounded-lg border border-line/40 bg-white p-4 shadow-sm lg:p-5 ${className}`}>
      <h2 id={`summary-title-${showPayButton ? "desktop" : "mobile"}`} className="font-serif text-xl font-bold lg:text-2xl">
        Shopping Summary
      </h2>

      <dl className="mt-4 flex flex-col gap-2.5">
        <Line label="Product Subtotal" value={formatCurrency(summary.productSubtotal)} />
        <Line label="Shipping Subtotal" value={formatCurrency(summary.shippingSubtotal)} />
        <Line label="Buyer Service Fee" value={formatCurrency(summary.buyerServiceFee)} info />
        <Line label="Handling Fee" value={formatCurrency(summary.handlingFee)} info />
        {draft.damageProtection.enabled && (
          <Line label="Damage Protection" value={formatCurrency(summary.damageProtectionFee)} />
        )}
        <Line
          label="Discount"
          value={summary.discount > 0 ? `- ${formatCurrency(summary.discount)}` : formatCurrency(summary.discount)}
          green={summary.discount > 0}
        />
      </dl>

      <div aria-live="polite" className="mt-3 flex items-center justify-between border-t border-line/40 pt-3">
        <span className="text-sm font-bold">Total</span>
        <span className="text-base font-bold">{formatCurrency(summary.total)}</span>
      </div>

      {showPayButton && (
        <>
          {hint && (
            <p id="pay-now-hint" className="mt-3 text-xs text-muted">
              {hint}
            </p>
          )}
          <Button
            variant="brand"
            className="mt-3"
            disabled={!canPay}
            loading={paying}
            aria-describedby={hint ? "pay-now-hint" : undefined}
            onClick={onPay}
          >
            Pay Now
          </Button>
        </>
      )}
    </section>
  );
}
