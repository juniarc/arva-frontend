import { Apple, Leaf, Package, Sprout, Tag, Wrench, type LucideIcon } from "lucide-react";

/** Maps the backend's `iconKey` to an icon. Unknown keys get a generic tag icon. */
const ICONS: Record<string, LucideIcon> = {
  seeds: Sprout,
  vegetables: Leaf,
  fruits: Apple,
  fertilizers: Package,
  equipments: Wrench,
};

export function categoryIcon(iconKey: string): LucideIcon {
  return ICONS[iconKey] ?? Tag;
}

/** The /products page is not built yet. */
export function categoryHref(slug: string): string {
  return `/products?category=${encodeURIComponent(slug)}`;
}
