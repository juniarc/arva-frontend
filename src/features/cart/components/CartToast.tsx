"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Alert } from "@/components/ui/Alert";

const TOAST_MS = 3000;

interface CartToastProps {
  /** The text to show. Nothing is rendered when it is null. */
  message: string | null;
  /** Defaults to "success". */
  variant?: "success" | "error";
  onDismiss: () => void;
}

/** Message at the top of the page. It hides itself after 3 seconds. */
export function CartToast({ message, variant = "success", onDismiss }: CartToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, TOAST_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return createPortal(
    <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-7xl p-4">
      <Alert variant={variant} message={message} onClose={onDismiss} />
    </div>,
    document.body,
  );
}
