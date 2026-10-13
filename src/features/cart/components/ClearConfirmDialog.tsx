"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface ClearConfirmDialogProps {
  open: boolean;
  /** Number of selected items that will be removed. */
  count: number;
  busy: boolean;
  onConfirm: () => void;
  /** Called after the native dialog has closed (Cancel, Escape, or when `open` becomes false). */
  onClose: () => void;
}

/**
 * Confirmation before removing items. A native <dialog> opened with showModal(), like AddToCartModal:
 * it traps focus, closes on Escape, and the browser returns focus to the Clear button when it closes.
 * The parent keeps it mounted and drives it with `open`, so closing always goes through dialog.close().
 */
export function ClearConfirmDialog({ open, count, busy, onConfirm, onClose }: ClearConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white p-6 text-ink backdrop:bg-black/50"
    >
      <h2 id={titleId} className="text-base font-bold">
        Remove {count} selected {count === 1 ? "item" : "items"} from your cart?
      </h2>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" disabled={busy} onClick={() => dialogRef.current?.close()}>
          Cancel
        </Button>
        <Button variant="brand" loading={busy} onClick={onConfirm}>
          Remove
        </Button>
      </div>
    </dialog>
  );
}
