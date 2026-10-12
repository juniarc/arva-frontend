import { Apple, Leaf, Package, Sprout, Wrench, type LucideIcon } from "lucide-react";
import type { CategorySlug } from "../types";

export interface Category {
  slug: CategorySlug;
  name: string;
  icon: LucideIcon;
}

/** The single category list. The sidebar, mobile row, tiles, menu and footer all read it. */
export const CATEGORIES: readonly Category[] = [
  { slug: "seeds", name: "Seeds", icon: Sprout },
  { slug: "vegetables", name: "Vegetables", icon: Leaf },
  { slug: "fruits", name: "Fruits", icon: Apple },
  { slug: "fertilizers", name: "Fertilizers", icon: Package },
  { slug: "equipments", name: "Equipments", icon: Wrench },
];

/** The /products page is not built yet. */
export function categoryHref(slug: CategorySlug): string {
  return `/products?category=${slug}`;
}
