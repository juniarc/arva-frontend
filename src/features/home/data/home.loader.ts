import "server-only";
import { getCategories, getHome } from "@/features/products/api/catalog.server";
import type { HomeSectionsData } from "../types";

/** Loads everything the home page shows from GET /home and GET /categories. */
export async function getHomeSections(): Promise<HomeSectionsData> {
  const [home, categories] = await Promise.all([getHome(), getCategories()]);

  return {
    banners: home.banners,
    categories,
    popularProducts: home.sections.popular,
    fruits: home.sections.fruits,
    equipments: home.sections.equipments,
  };
}
