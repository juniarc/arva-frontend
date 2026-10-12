import Link from "next/link";
import { ProductCard } from "@/features/products/components/ProductCard";
import type { Product } from "@/features/products/types";

interface ProductSectionProps {
  /** Used for the heading id as well, so keep it unique on the page. */
  title: string;
  viewAllHref: string;
  products: Product[];
  /** Lets the cards decide between opening the add-to-cart modal and sending guests to /login. */
  isLoggedIn?: boolean;
  /** "home": 2 columns on tablet, 4 on desktop. "detail": 3 on tablet, 5 on desktop. */
  columns?: "home" | "detail";
}

const GRID_COLUMNS = {
  home: "md:grid-cols-2 lg:grid-cols-4",
  detail: "md:grid-cols-3 lg:grid-cols-5",
};

/**
 * Title, "View all" link, and the products.
 * Mobile: horizontal scroll row where the next card peeks in. Tablet: 2 columns. Desktop: 4 columns.
 */
export function ProductSection({ title, viewAllHref, products, isLoggedIn = false, columns = "home" }: ProductSectionProps) {
  const headingId = `section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id={headingId} className="font-serif text-xl font-bold text-ink md:text-2xl">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="flex min-h-11 items-center text-xs text-ink underline hover:text-brand focus-visible:outline-2 focus-visible:outline-info"
        >
          View all
        </Link>
      </div>

      <ul
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] md:grid md:gap-4 md:overflow-visible ${GRID_COLUMNS[columns]}`}>
        {products.map((product) => (
          <li key={product.id} className="w-[65%] shrink-0 snap-start md:w-auto">
            <ProductCard product={product} isLoggedIn={isLoggedIn} />
          </li>
        ))}
      </ul>
    </section>
  );
}
