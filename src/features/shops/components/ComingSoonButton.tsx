import type { ReactNode } from "react";

export const COMING_SOON = "Coming soon.";

interface ComingSoonButtonProps {
  /** Unique on the page: the button points to its own "Coming soon." text with it. */
  id: string;
  /** Names the button for screen readers when its text is only an icon. */
  label: string;
  className?: string;
  children: ReactNode;
}

/**
 * A button for something that is not built yet (add, edit and delete a product).
 * It is disabled, so it calls nothing. A disabled button does not always show its title, so the wrapper
 * carries the tooltip, and aria-describedby points to the same words for screen readers.
 */
export function ComingSoonButton({ id, label, className = "", children }: ComingSoonButtonProps) {
  return (
    <span title={COMING_SOON} className="inline-flex">
      <button
        type="button"
        disabled
        aria-label={label}
        aria-describedby={id}
        className={`inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-sm px-4 text-xs font-bold opacity-60 lg:min-h-8 ${className}`}
      >
        {children}
      </button>
      <span id={id} className="sr-only">
        {COMING_SOON}
      </span>
    </span>
  );
}
