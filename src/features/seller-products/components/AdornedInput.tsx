import type { ReactNode } from "react";

/** Keeps digits only as the user types (prices, stock, sizes). Passed to react-hook-form's register. */
export const digitsOnly = {
  onChange: (event: { target: HTMLInputElement }) => {
    event.target.value = event.target.value.replace(/\D/g, "");
  },
};

/**
 * An input with a fixed word in front ("Rp.") or behind ("g", "cm"). The word is shown, not typed,
 * so the value stays a plain number. The input needs room for it: pl-11 for a prefix, pr-11 for a suffix.
 */
export function AdornedInput({ prefix, suffix, children }: { prefix?: string; suffix?: string; children: ReactNode }) {
  return (
    <div className="relative">
      {prefix && (
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink">
          {prefix}
        </span>
      )}
      {children}
      {suffix && (
        <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}
