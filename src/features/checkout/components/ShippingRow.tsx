import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { ShippingChoice } from "../types";

interface ShippingRowProps {
  shipping: ShippingChoice | null;
  pending: boolean;
  onOpen: () => void;
}

/** Yellow card. "Select Shipping" until one is chosen, then the courier and its estimate. */
export function ShippingRow({ shipping, pending, onOpen }: ShippingRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-busy={pending || undefined}
      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-md bg-sand px-4 py-3 text-left text-xs text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
    >
      {shipping ? (
        <span className="flex flex-col gap-1">
          <span className="font-bold">
            {shipping.label} ({formatCurrency(shipping.price)})
          </span>
          <span>{shipping.estimate}</span>
        </span>
      ) : (
        <span className="font-bold">Select Shipping</span>
      )}
      <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
    </button>
  );
}
