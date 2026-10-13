"use client";

import { MOBILE_SORT_OPTIONS, sortOptionFor } from "../constants/sort-options";
import type { ProductsQuery } from "../query/products-query";
import { useProductsNavigation } from "../query/useProductsNavigation";
import { FilterSheetShell } from "./FilterSheetShell";

interface MobileSortSheetProps {
  open: boolean;
  query: ProductsQuery;
  onClose: () => void;
}

/** "Short By" sheet. Choosing an option applies it at once and closes the sheet. */
export function MobileSortSheet({ open, query, onClose }: MobileSortSheetProps) {
  const { apply } = useProductsNavigation(query);
  const current = sortOptionFor(query.sort);

  return (
    <FilterSheetShell open={open} title="Short By" onClose={onClose}>
      <div role="radiogroup" aria-label="Short By" className="overflow-y-auto px-5 pb-5">
        {MOBILE_SORT_OPTIONS.map((option) => (
          <label
            key={option.id}
            className="flex min-h-12 cursor-pointer items-center justify-between border-b border-line/40 text-sm last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-info"
          >
            {option.label}
            <input
              type="radio"
              name="sort"
              value={option.id}
              checked={option.id === current.id}
              onChange={() => {
                if (option.value !== query.sort) apply({ sort: option.value });
                onClose();
              }}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-full border-2 border-brand peer-checked:after:size-3 peer-checked:after:rounded-full peer-checked:after:bg-brand"
            />
          </label>
        ))}
      </div>
    </FilterSheetShell>
  );
}
