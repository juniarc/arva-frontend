"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface FilterSheetShellProps {
  open: boolean;
  title: string;
  /** Called after the sheet has closed (X, Escape, backdrop). */
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet below 768px, centered card from 768px, as in AddToCartModal.
 * A native <dialog> opened with showModal() gives the focus trap and the backdrop.
 * It also closes on Escape, locks body scroll while open, and puts focus back on the
 * button that opened it. The slide-up animation is off for prefers-reduced-motion.
 */
export function FilterSheetShell({ open, title, onClose, children }: FilterSheetShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      opener.current = document.activeElement;
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();

    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleClose = () => {
    if (opener.current instanceof HTMLElement) opener.current.focus();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={handleClose}
      onClick={(event) => {
        // The dialog has no padding, so a click on the dialog itself is a click on the backdrop.
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          dialogRef.current?.close();
        }
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none flex-col rounded-t-xl bg-white p-0 text-ink backdrop:bg-black/50 open:flex open:animate-sheet-up open:backdrop:animate-fade-in motion-reduce:animate-none motion-reduce:backdrop:animate-none md:inset-0 md:m-auto md:max-w-md md:rounded-xl md:open:animate-fade-in"
    >
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <h2 id={titleId} className="font-serif text-xl font-bold">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
          className="-mr-3 flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-info"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
