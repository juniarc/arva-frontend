"use client";

import { CircleCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

interface OrderReceivedModalProps {
  open: boolean;
  /** The order code from the backend, shown as "#ORD123". */
  code: string | null;
  /** Escape closes it too. A click outside does not. */
  onClose: () => void;
}

export function OrderReceivedModal({ open, code, onClose }: OrderReceivedModalProps) {
  return (
    <ModalShell open={open} title="Your order has been received" onClose={onClose} dismissOnBackdrop={false} showCloseButton={false} centerTitle>
      <div className="flex flex-col items-center gap-3 px-5 pb-6 text-center">
        <CircleCheck className="size-10 text-brand" aria-hidden="true" />
        <p className="text-xs text-muted">Thank you for your purchase</p>
        <p className="text-xs">
          Your order id : <strong>#{code}</strong>
        </p>
        <ButtonLink href="/products" variant="mint" className="mt-2">
          Continue Shopping
        </ButtonLink>
      </div>
    </ModalShell>
  );
}
