import Link from "next/link";
import { CATEGORIES, categoryHref } from "@/features/products/data/categories";

/** Desktop-only row of square category tiles. Wrap it in <DesktopOnly>. */
export function BrowseCategories() {
  return (
    <section aria-labelledby="browse-categories-title">
      <h2 id="browse-categories-title" className="mb-3 font-serif text-2xl font-bold text-ink">
        Browse by Categories
      </h2>
      <ul className="grid max-w-xl grid-cols-5 gap-4">
        {CATEGORIES.map(({ slug, name, icon: Icon }) => (
          <li key={slug}>
            <Link
              href={categoryHref(slug)}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md bg-mint text-xs text-ink shadow-sm hover:brightness-95 focus-visible:outline-2 focus-visible:outline-info"
            >
              <Icon className="size-6" aria-hidden="true" />
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
