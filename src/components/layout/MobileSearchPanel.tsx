"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

/** Green search strip that slides down under the mobile header. */
export function MobileSearchPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div
      inert={!open}
      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <form
          action="/search"
          role="search"
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
          className="px-4 pb-3 pt-1"
        >
          <div className="flex items-center gap-2 rounded-sm bg-white p-1.5 pl-4">
            <label htmlFor="mobile-search" className="sr-only">
              Search Arva
            </label>
            <input
              ref={inputRef}
              id="mobile-search"
              name="q"
              type="search"
              placeholder="Search Arva"
              className="h-8 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-brand text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
            >
              <Search className="size-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
