"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buildProductsHref, clearFilters, withFilterChange, type ProductsFilters, type ProductsQuery } from "./products-query";

/**
 * Changes the products URL. Every change goes back to page 1 and keeps the scroll position.
 * `isPending` is true while the new page is loading.
 */
export function useProductsNavigation(query: ProductsQuery) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const go = (next: ProductsQuery) => {
    startTransition(() => router.push(buildProductsHref(next), { scroll: false }));
  };

  return {
    isPending,
    /** Sets the given filters. A key set to `undefined` clears that filter. */
    apply: (change: ProductsFilters) => go(withFilterChange(query, change)),
    reset: () => go(clearFilters()),
  };
}
