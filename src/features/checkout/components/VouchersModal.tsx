"use client";

import { ModalShell } from "@/components/ui/ModalShell";
import { getVouchers } from "../api/checkout.client";
import { useRemoteList } from "../state/useRemoteList";
import { RemoteListMessage } from "./RemoteListMessage";

interface VouchersModalProps {
  open: boolean;
  /** The voucher the draft uses now, if any. */
  selectedId: string | undefined;
  /** `null` removes the voucher. */
  onSelect: (voucherId: string | null) => void;
  onClose: () => void;
}

export function VouchersModal({ open, selectedId, onSelect, onClose }: VouchersModalProps) {
  const list = useRemoteList(open ? getVouchers : null, open ? "open" : "closed");

  return (
    <ModalShell open={open} title="Vouchers" onClose={onClose}>
      <div className="overflow-y-auto pb-5">
        <RemoteListMessage
          status={list.status}
          unavailableText="Vouchers are not available yet."
          errorText="Could not load vouchers."
          onRetry={list.retry}
        />
        {list.status === "ready" && list.items.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-muted">No vouchers available.</p>
        )}
        {list.status === "ready" && (
          <ul className="px-5">
            {list.items.map((voucher) => {
              const used = voucher.id === selectedId;
              return (
                <li key={voucher.id} className="flex items-start justify-between gap-3 border-b border-line/40 py-3 last:border-b-0">
                  <div className="flex min-w-0 flex-col gap-1 text-xs">
                    <p className="font-bold">{voucher.title}</p>
                    {voucher.description && <p>{voucher.description}</p>}
                    <p className="mt-1 w-fit rounded-sm bg-chip px-2 py-1 text-[10px] font-medium">{voucher.code}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={used ? `Remove voucher ${voucher.title}` : `Use voucher ${voucher.title}`}
                    onClick={() => onSelect(used ? null : voucher.id)}
                    className="flex min-h-11 shrink-0 items-center text-xs font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-info"
                  >
                    {used ? "Used" : "Use Voucher"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}
