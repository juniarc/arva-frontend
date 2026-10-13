import { Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatCurrency } from "@/lib/format";
import { variantsText } from "../mappers/shop-product.mapper";
import type { OwnerShopProduct } from "../types";
import { ComingSoonButton } from "./ComingSoonButton";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words font-semibold text-ink">{children}</dd>
    </div>
  );
}

/** One product of the owner's shop. Add, edit and delete are not built yet, so those buttons are disabled. */
export function OwnerProductRow({ item }: { item: OwnerShopProduct }) {
  const { product, manage } = item;
  const discount = product.discountPercent ? `${product.discountPercent} %` : "None";

  return (
    <li className="flex flex-col gap-3 border-b border-line/30 py-4 last:border-b-0 lg:flex-row lg:items-start lg:gap-5">
      <div className="flex gap-3 lg:flex-1 lg:gap-5">
        <div className="relative size-22 shrink-0 overflow-hidden rounded-sm bg-surface lg:size-24">
          <SafeImage src={product.imageUrl} alt="" fill sizes="6rem" className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold text-ink">
            <Link href={`/products/${product.slug}`} className="focus-visible:outline-2 focus-visible:outline-info">
              {product.name}
            </Link>
          </h3>
          {!manage.isActive && (
            <span className="mt-1 inline-block rounded-sm bg-chip px-2 py-0.5 text-xs text-ink">Inactive</span>
          )}
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <Detail label="Price">{formatCurrency(product.price)}</Detail>
            <Detail label="Category">{product.categoryName}</Detail>
            <Detail label="Available Variants">{variantsText(manage.variantLabels)}</Detail>
            <Detail label="Stocks">{manage.totalStock}</Detail>
            <Detail label="Active Discount">{discount}</Detail>
          </dl>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-line/30 pt-2 text-xs">
            <div className="contents text-brand">
              <dt>Sold</dt>
              <dd className="font-semibold">{product.soldCount}</dd>
            </div>
            <div className="contents text-brand">
              <dt>Ratings</dt>
              <dd className="flex items-center gap-1 font-semibold text-ink">
                <Star className="size-3 fill-star text-star" aria-hidden="true" />
                {product.rating.toFixed(1)} ({manage.ratingCount})
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <ComingSoonButton
          id={`coming-soon-delete-${product.id}`}
          label={`Delete ${product.name}`}
          className="border border-danger text-danger"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </ComingSoonButton>
        <ComingSoonButton
          id={`coming-soon-edit-${product.id}`}
          label={`Edit product ${product.name}`}
          className="bg-brand text-white"
        >
          Edit Product
        </ComingSoonButton>
      </div>
    </li>
  );
}
