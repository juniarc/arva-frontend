import { X } from "lucide-react";

export type AlertVariant = "success" | "error";

const STYLES: Record<AlertVariant, string> = {
  success: "bg-mint text-brand",
  // danger-strong keeps the red text readable (AA) on the soft red background.
  error: "border border-danger bg-danger-soft text-danger-strong",
};

interface AlertProps {
  variant: AlertVariant;
  /** Text comes from the caller. */
  message: string;
  /** When set, a close button is shown. */
  onClose?: () => void;
  className?: string;
}

/**
 * Full-width banner for success and failure feedback.
 * Errors use role="alert" (announced immediately); success uses role="status"
 * (announced politely).
 */
export function Alert({ variant, message, onClose, className = "" }: AlertProps) {
  const isError = variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? undefined : "polite"}
      className={`flex items-center gap-2 rounded-sm px-4 py-3 text-sm font-semibold md:px-5 ${STYLES[variant]} ${className}`}
    >
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className="-mr-2 flex size-11 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-info md:size-8"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
