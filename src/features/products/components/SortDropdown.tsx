"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { DESKTOP_SORT_OPTIONS, sortOptionFor } from "../constants/sort-options";
import type { ProductsQuery } from "../query/products-query";
import { useProductsNavigation } from "../query/useProductsNavigation";

/** Desktop "Sort By :" dropdown. Choosing an option changes the URL. Escape or a click outside closes it. */
export function SortDropdown({ query }: { query: ProductsQuery }) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { apply } = useProductsNavigation(query);
  const current = sortOptionFor(query.sort);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative flex items-center gap-2"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <span id={`${listId}-label`} className="text-xs font-bold">
        Sort By :
      </span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${listId}-label ${listId}-value`}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-9 min-w-40 items-center justify-between gap-3 rounded-sm border border-line/60 bg-white px-3 text-xs focus-visible:outline-2 focus-visible:outline-info"
      >
        <span id={`${listId}-value`}>{current.label}</span>
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={`${listId}-label`}
          className="absolute right-0 top-full z-30 mt-1 w-full min-w-40 rounded-sm border border-line/40 bg-white py-1 shadow-md"
        >
          {DESKTOP_SORT_OPTIONS.map((option) => (
            <li key={option.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={option.id === current.id}
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                  if (option.value !== query.sort) apply({ sort: option.value });
                }}
                className={`flex min-h-8 w-full items-center px-3 text-left text-xs hover:bg-surface focus-visible:outline-2 focus-visible:outline-info ${
                  option.id === current.id ? "font-medium text-brand" : ""
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
