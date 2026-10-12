import type { ReactNode } from "react";

/** Small red label, e.g. a discount percentage. */
export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm bg-danger-soft px-1 py-0.5 text-[10px] font-medium text-danger-strong ${className}`}
    >
      {children}
    </span>
  );
}
