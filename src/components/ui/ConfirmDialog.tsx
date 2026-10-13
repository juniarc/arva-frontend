"use client";

import { useEffect, useId, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  /** The action button. Outlined in red, on the left. */
  confirmLabel: string;
  /** The way out. Filled red, on the right, and it gets the focus first. */
  cancelLabel: string;
  /** While true, a spinner replaces the buttons and the dialog cannot be closed. */
  loading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  /** Called after the native dialog has closed (Cancel, Escape, backdrop, or when `open` becomes false). */
  onClose: () => void;
}

const BUTTON =
  "flex min-h-11 flex-1 items-center justify-center rounded-sm border border-danger px-4 text-sm font-bold " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info";

/**
 * "Are you sure?" dialog. A native <dialog> opened with showModal(): it traps focus and has a backdrop.
 * The parent keeps it mounted and drives it with `open`, so closing always goes through dialog.close().
 * Initial focus is on Cancel (the safe choice), Escape closes it, and focus goes back to the
 * element that opened it. role="alertdialog" tells screen readers it needs an answer.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  loading = false,
  loadingLabel = "Loading",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      opener.current = document.activeElement;
      dialog.showModal();
      cancelRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const requestClose = () => {
    if (!loading) dialogRef.current?.close();
  };

  const handleClose = () => {
    if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={loading || undefined}
      onCancel={(event) => {
        if (loading) event.preventDefault();
      }}
      onClose={handleClose}
      onClick={(event) => {
        // The dialog has no padding, so a click on the dialog itself is a click on the backdrop.
        if (event.target === event.currentTarget) requestClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          requestClose();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-md bg-white p-6 text-center text-ink shadow-lg backdrop:bg-black/50"
    >
      <h2 id={titleId} className="text-base font-bold md:text-lg">
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className="mt-2 text-sm text-muted">
          {description}
        </p>
      )}

      {loading ? (
        <div className="mt-5 flex justify-center">
          <svg
            role="img"
            aria-label={loadingLabel}
            className="size-10 animate-spin text-brand"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      ) : (
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onConfirm} className={`${BUTTON} bg-white text-danger hover:bg-danger-soft`}>
            {confirmLabel}
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={requestClose}
            className={`${BUTTON} bg-danger text-white hover:brightness-95`}
          >
            {cancelLabel}
          </button>
        </div>
      )}
    </dialog>
  );
}
