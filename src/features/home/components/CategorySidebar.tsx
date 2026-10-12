import { Award, Percent } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { categoryHref, categoryIcon } from "@/features/products/data/categories";
import type { Category } from "@/features/products/types";
import type { Banner } from "../types";
import { BannerFrame } from "./BannerFrame";

const ROW =
  "flex min-h-11 items-center gap-3 rounded-sm px-2 text-xs text-ink hover:text-brand " +
  "focus-visible:outline-2 focus-visible:outline-info";

interface CategorySidebarProps {
  categories: Category[];
  banners: Banner[];
}

/** Desktop-only category card plus the tall promo banners. Wrap it in <DesktopOnly>. */
export function CategorySidebar({ categories, banners }: CategorySidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      <nav aria-labelledby="sidebar-category-title" className="rounded-md bg-surface p-4">
        <h2 id="sidebar-category-title" className="font-serif text-lg font-bold text-ink">
          Category
        </h2>
        <span className="mb-3 mt-1 block h-0.5 w-8 bg-brand" aria-hidden="true" />

        <ul>
          {categories.map(({ id, slug, name, iconKey }) => {
            const Icon = categoryIcon(iconKey);
            return (
              <li key={id}>
                <Link href={categoryHref(slug)} className={ROW}>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>

        <hr className="my-2 border-mint" />

        <ul>
          <li>
            <Link href="/products?sort=popular" className={ROW}>
              <Award className="size-4 shrink-0" aria-hidden="true" />
              Popular Products
            </Link>
          </li>
          <li>
            <Link href="/products?discount=true" className={ROW}>
              <Percent className="size-4 shrink-0" aria-hidden="true" />
              Discount Products
            </Link>
          </li>
        </ul>
      </nav>

      {banners.map((banner) => (
        <BannerFrame
          key={banner.id}
          href={banner.linkUrl}
          className="relative block aspect-[3/5] overflow-hidden rounded-md bg-brand"
        >
          <SafeImage src={banner.imageUrl} alt={banner.title} fill sizes="15rem" className="object-cover" />
        </BannerFrame>
      ))}
    </div>
  );
}
