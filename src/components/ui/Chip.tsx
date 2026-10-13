import type { ComponentProps, ReactNode } from "react";

interface ChipProps extends Omit<ComponentProps<"button">, "children"> {
  /** Selected chips are mint; others are white with a gray border. Sets aria-pressed. */
  selected?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

/** Toggle chip used by the mobile filter row and the filter sheet. 44px tall for touch. */
export function Chip({ selected, icon, children, className = "", type = "button", ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm border px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info ${
        selected ? "border-brand/40 bg-mint font-medium text-brand" : "border-line/60 bg-white text-ink hover:bg-surface"
      } ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
