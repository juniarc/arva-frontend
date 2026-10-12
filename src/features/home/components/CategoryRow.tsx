import Link from "next/link";
import { categoryHref, categoryIcon } from "@/features/products/data/categories";
import type { Category } from "@/features/products/types";

/** Mobile and tablet category shortcuts: icon tiles in one row. Wrap it in <BelowDesktop>. */
export function CategoryRow({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Browse categories" className="rounded-md bg-white p-3 shadow-sm">
      <ul className="grid grid-cols-5 gap-2">
        {categories.map(({ id, slug, name, iconKey }) => {
          const Icon = categoryIcon(iconKey);
          return (
            <li key={id}>
              <Link
                href={categoryHref(slug)}
                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-md bg-mint px-0.5 text-[10px] text-ink focus-visible:outline-2 focus-visible:outline-info"
              >
                <Icon className="size-5" aria-hidden="true" />
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
