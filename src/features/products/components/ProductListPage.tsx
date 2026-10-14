import Link from "next/link";
import type { ReactNode } from "react";
import { buildProductsHref, type ProductsQuery } from "../query/products-query";
import type { Category } from "../types";
import { FilterSidebar } from "./FilterSidebar";
import { MobileChipBar } from "./MobileChipBar";
import { SortDropdown } from "./SortDropdown";

interface ProductListPageProps {
  query: ProductsQuery;
  categories: Category[];
  /** The results (grid and pagination). They load on their own, inside a Suspense boundary. */
  children: ReactNode;
  /** Shown above the results when there is a search: the shops that match it. */
  shops?: ReactNode;
}

/**
 * The page frame. One tree for every screen size: the desktop sidebar and sort row show from 1024px,
 * the chip bar (with the filter and sort sheets) shows below it.
 */
export function ProductListPage({ query, categories, children, shops }: ProductListPageProps) {
  const category = categories.find((item) => item.slug === query.category);
  const title = query.q ? `Results for "${query.q}"` : (category?.name ?? "Products");

  return (
    <>
      <MobileChipBar query={query} categories={categories} />

      <div className="mx-auto max-w-300 px-4 pb-10 pt-4 lg:px-6 lg:pt-8">
        {query.q ? (
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-serif text-xl font-bold text-ink lg:text-2xl">{title}</h1>
            <Link
              href={buildProductsHref({ ...query, q: undefined, page: 1 })}
              className="text-sm font-bold text-brand underline focus-visible:outline-2 focus-visible:outline-info"
            >
              Clear search
            </Link>
          </div>
        ) : (
          <h1 className="sr-only">{title}</h1>
        )}
        {shops}

        <div className="mb-4 hidden items-center justify-between lg:flex">
          <p className="text-sm font-bold">Filter By :</p>
          <SortDropdown query={query} />
        </div>

        <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6">
          <div className="hidden lg:block">
            <FilterSidebar query={query} categories={categories} />
          </div>
          <div>{children}</div>
        </div>
      </div>
    </>
  );
}
