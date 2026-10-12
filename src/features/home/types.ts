import type { Banner } from "@/features/products/schemas/catalog.schema";
import type { Category, Product } from "@/features/products/types";

export type { Banner };

/** Everything the home page shows. Built by `getHomeSections()`. */
export interface HomeSectionsData {
  banners: {
    carousel: Banner[];
    promoStrips: Banner[];
    sideBanners: Banner[];
    verticalBanners: Banner[];
  };
  categories: Category[];
  popularProducts: Product[];
  fruits: Product[];
  equipments: Product[];
}
