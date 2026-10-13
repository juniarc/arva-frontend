import { BadgePercent, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { VoucherChoice } from "../types";

interface VoucherRowProps {
  voucher: VoucherChoice | null;
  pending: boolean;
  onOpen: () => void;
}

/** Mint card. "Select Voucher" until one is used, then what the user saved (the amount comes from the backend). */
export function VoucherRow({ voucher, pending, onOpen }: VoucherRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-busy={pending || undefined}
      className="flex min-h-14 w-full items-center gap-3 rounded-md bg-mint px-4 py-3 text-left text-xs text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
    >
      <BadgePercent className="size-5 shrink-0 text-danger" aria-hidden="true" />
      {voucher ? (
        <span className="flex flex-1 flex-col gap-1">
          <span className="font-bold">Vouchers successfully used</span>
          <span>
            Yay, you saved <strong>{formatCurrency(voucher.discountAmount)}</strong>
          </span>
        </span>
      ) : (
        <span className="flex-1 font-bold">Select Voucher</span>
      )}
      <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
    </button>
  );
}
