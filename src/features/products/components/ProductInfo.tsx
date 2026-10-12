import { Rating } from "@/components/ui/Rating";
import { formatSold } from "@/lib/format";
import type { ProductDetail } from "../types";
import { SelectedPrice } from "./SelectedPrice";

/** Category, title (the page's h1), price and rating. The price follows the selected variant. */
export function ProductInfo({ product }: { product: ProductDetail }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">{product.categoryName}</p>
      <h1 className="line-clamp-3 text-lg font-bold text-ink md:text-xl lg:line-clamp-2">{product.name}</h1>
      <SelectedPrice />
      <p className="flex items-center gap-2 pt-1 text-xs text-ink md:text-sm">
        <Rating value={product.rating} />
        <span aria-hidden="true">|</span>
        <span>{formatSold(product.soldCount)}</span>
      </p>
    </div>
  );
}
