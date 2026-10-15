"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface MobileDrawerProps {
  open: boolean;
  /** Called when the drawer closes itself: Escape key or a click on the backdrop. */
  onClose: () => void;
  label: string;
  children: ReactNode;
}

/**
 * Right-hand slide-in panel built on a native <dialog> (focus trap, Escape, backdrop, and focus goes back
 * to the button that opened it). The page behind is locked while it is open.
 * Open state is controlled by the parent so only one panel is open at a time.
 */
export function MobileDrawer({
  open,
  onClose,
  label,
  children,
}: MobileDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // The page behind does not scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        // A click on the dimmed backdrop lands on the <dialog> itself, left of the panel.
        if (event.clientX < event.currentTarget.getBoundingClientRect().left)
          onClose();
      }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-72 max-w-[85%] translate-x-full flex-col bg-white p-0 transition-[translate,display,overlay] duration-300 ease-out transition-discrete open:flex open:translate-x-0 starting:open:translate-x-full motion-reduce:transition-none backdrop:bg-black/0 backdrop:transition-[background-color,display,overlay] backdrop:duration-300 backdrop:transition-discrete open:backdrop:bg-black/50 starting:open:backdrop:bg-black/0 motion-reduce:backdrop:transition-none"
    >
      {children}
    </dialog>
  );
}
