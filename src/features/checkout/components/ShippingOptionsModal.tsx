"use client";

import { ModalShell } from "@/components/ui/ModalShell";
import { formatCurrency } from "@/lib/format";
import { getShippingOptions } from "../api/checkout.client";
import { useRemoteList } from "../state/useRemoteList";
import { RemoteListMessage } from "./RemoteListMessage";

interface ShippingOptionsModalProps {
  open: boolean;
  selectedId: string | undefined;
  onSelect: (optionId: string) => void;
  onClose: () => void;
}

export function ShippingOptionsModal({ open, selectedId, onSelect, onClose }: ShippingOptionsModalProps) {
  // Loaded each time the modal opens.
  const list = useRemoteList(open ? getShippingOptions : null, open ? "open" : "closed");

  return (
    <ModalShell open={open} title="Shipping Options" onClose={onClose}>
      <div className="overflow-y-auto pb-5">
        <RemoteListMessage
          status={list.status}
          unavailableText="Shipping options are not available yet."
          errorText="Could not load shipping options."
          onRetry={list.retry}
        />
        {list.status === "ready" && list.items.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-muted">No shipping options available.</p>
        )}
        {list.status === "ready" && (
          <ul className="px-5">
            {list.items.map((option) => (
              <li key={option.id} className="border-b border-line/40 last:border-b-0">
                <button
                  type="button"
                  aria-pressed={option.id === selectedId}
                  onClick={() => onSelect(option.id)}
                  className="flex min-h-14 w-full flex-col justify-center gap-1 py-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-info"
                >
                  <span className="font-bold">
                    {option.label} ({formatCurrency(option.price)})
                  </span>
                  <span>{option.estimate}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}
