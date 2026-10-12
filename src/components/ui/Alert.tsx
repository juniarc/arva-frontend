export type AlertVariant = "success" | "error";

const STYLES: Record<AlertVariant, string> = {
  success: "border-info bg-mint text-ink",
  error: "border-danger bg-danger-soft text-danger-strong",
};

interface AlertProps {
  variant: AlertVariant;
  message: string;
  className?: string;
}

/**
 * Banner for form-level feedback.
 * Errors use role="alert" (announced immediately); success uses role="status"
 * (announced politely).
 */
export function Alert({ variant, message, className = "" }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-md border px-4 py-2.5 text-xs font-medium ${STYLES[variant]} ${className}`}
    >
      {message}
    </div>
  );
}
