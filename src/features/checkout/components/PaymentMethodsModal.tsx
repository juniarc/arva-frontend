"use client";

import { useId } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { getPaymentMethods } from "../api/checkout.client";
import { useRemoteList } from "../state/useRemoteList";
import { RemoteListMessage } from "./RemoteListMessage";

interface PaymentMethodsModalProps {
  open: boolean;
  selectedId: string | undefined;
  onSelect: (methodId: string) => void;
  onClose: () => void;
}

export function PaymentMethodsModal({ open, selectedId, onSelect, onClose }: PaymentMethodsModalProps) {
  const groupId = useId();
  const list = useRemoteList(open ? getPaymentMethods : null, open ? "open" : "closed");

  return (
    <ModalShell open={open} title="Payment Methods" onClose={onClose}>
      <div className="overflow-y-auto pb-5">
        <RemoteListMessage
          status={list.status}
          unavailableText="Payment methods are not available yet."
          errorText="Could not load payment methods."
          onRetry={list.retry}
        />
        {list.status === "ready" && list.items.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-muted">No payment methods available.</p>
        )}
        {list.status === "ready" && list.items.length > 0 && (
          <div role="radiogroup" aria-label="Payment Methods" className="px-5">
            {list.items.map((method) => (
              <label
                key={method.id}
                className={`flex min-h-12 items-center gap-3 border-b border-line/40 text-xs last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-info ${
                  method.available ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                }`}
              >
                <span aria-hidden="true" className="size-6 shrink-0 rounded-sm bg-chip" />
                <span className="flex-1">
                  {method.label}
                  {!method.available && <span className="ml-2 text-muted">Unavailable</span>}
                </span>
                <input
                  type="radio"
                  name={groupId}
                  value={method.id}
                  checked={method.id === selectedId}
                  disabled={!method.available}
                  onChange={() => onSelect(method.id)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex size-5 items-center justify-center rounded-full border-2 border-brand peer-checked:after:size-2.5 peer-checked:after:rounded-full peer-checked:after:bg-brand"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
