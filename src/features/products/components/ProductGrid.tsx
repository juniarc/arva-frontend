import type { Product } from "../types";
import { ProductCard } from "./ProductCard";

/** 2 columns on mobile, 3 on tablet, 4 on desktop. The page size (12) fills whole rows in each. */
export function ProductGrid({ products, isLoggedIn }: { products: Product[]; isLoggedIn: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} isLoggedIn={isLoggedIn} />
        </li>
      ))}
    </ul>
  );
}

/** Placeholder with the same grid and card proportions, so nothing jumps when the products arrive. */
export function ProductGridSkeleton() {
  return (
    <ul aria-hidden="true" className="grid animate-pulse grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: 12 }, (_, index) => (
        <li key={index} className="overflow-hidden rounded-md border border-line/30">
          <div className="aspect-[4/3] bg-surface" />
          <div className="space-y-2 p-3">
            <div className="h-2.5 w-1/3 rounded-sm bg-surface" />
            <div className="h-10 rounded-sm bg-surface" />
            <div className="h-4 w-1/2 rounded-sm bg-surface" />
            <div className="h-8 rounded-sm bg-surface" />
          </div>
        </li>
      ))}
    </ul>
  );
}
