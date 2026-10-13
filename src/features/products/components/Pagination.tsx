import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getPageItems } from "../query/page-items";
import { buildProductsHref, withPage, type ProductsQuery } from "../query/products-query";

const CELL =
  "flex size-11 items-center justify-center rounded-sm text-xs focus-visible:outline-2 focus-visible:outline-info lg:size-8";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
} & (
  | { query: ProductsQuery; hrefFor?: never }
  /** For pages that are not the products page (for example a shop): the link for a page number. */
  | { hrefFor: (page: number) => string; query?: never }
);

/** Links only, so it works without JavaScript. Every link keeps the other filters in the URL. */
export function Pagination({ query, hrefFor: customHrefFor, currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => (customHrefFor ? customHrefFor(page) : buildProductsHref(withPage(query ?? { page: 1 }, page)));
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      {hasPrevious ? (
        <Link href={hrefFor(currentPage - 1)} aria-label="Previous page" className={`${CELL} hover:bg-surface`}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${CELL} opacity-30`}>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {getPageItems(currentPage, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} aria-hidden="true" className={CELL}>
            …
          </span>
        ) : item === currentPage ? (
          <span key={item} aria-current="page" className={`${CELL} bg-mint font-bold text-brand`}>
            {item}
          </span>
        ) : (
          <Link key={item} href={hrefFor(item)} aria-label={`Page ${item}`} className={`${CELL} hover:bg-surface`}>
            {item}
          </Link>
        ),
      )}

      {hasNext ? (
        <Link href={hrefFor(currentPage + 1)} aria-label="Next page" className={`${CELL} hover:bg-surface`}>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${CELL} opacity-30`}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
