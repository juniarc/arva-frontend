import { Award, Percent } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { CATEGORIES, categoryHref } from "@/features/products/data/categories";

const ROW =
  "flex min-h-11 items-center gap-3 rounded-sm px-2 text-xs text-ink hover:text-brand " +
  "focus-visible:outline-2 focus-visible:outline-info";

/** Desktop-only category card plus a tall promo banner. Wrap it in <DesktopOnly>. */
export function CategorySidebar({ bannerUrl }: { bannerUrl: string }) {
  return (
    <div className="flex flex-col gap-4">
      <nav aria-labelledby="sidebar-category-title" className="rounded-md bg-surface p-4">
        <h2 id="sidebar-category-title" className="font-serif text-lg font-bold text-ink">
          Category
        </h2>
        <span className="mb-3 mt-1 block h-0.5 w-8 bg-brand" aria-hidden="true" />

        <ul>
          {CATEGORIES.map(({ slug, name, icon: Icon }) => (
            <li key={slug}>
              <Link href={categoryHref(slug)} className={ROW}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {name}
              </Link>
            </li>
          ))}
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

      <div className="relative aspect-[3/5] overflow-hidden rounded-md bg-brand">
        <SafeImage src={bannerUrl} alt="Promotional banner" fill sizes="15rem" className="object-cover" />
      </div>
    </div>
  );
}
