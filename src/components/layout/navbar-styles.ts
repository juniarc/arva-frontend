/** Shared looks of the desktop navbar triggers and dropdown panels. */

export const TRIGGER =
  "relative flex min-h-11 items-center gap-1.5 rounded-sm px-1.5 text-xs text-ink hover:text-brand " +
  "focus-visible:outline-2 focus-visible:outline-info aria-expanded:bg-surface";

export const PANEL =
  "absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-line/30 " +
  "bg-white p-4 text-left shadow-lg";

export const BADGE =
  "flex size-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-white -ml-2 -mt-3";

/** What a trigger needs from the navbar to open and close its dropdown. */
export interface TriggerProps {
  open: boolean;
  onToggle: () => void;
  panelId: string;
  triggerRef: (element: HTMLButtonElement | null) => void;
}
