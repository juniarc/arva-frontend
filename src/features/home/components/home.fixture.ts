import type { Product } from "@/features/products/types";
import type { Banner, HomeSectionsData } from "../types";

export function makeProduct(index: number, overrides: Partial<Product> = {}): Product {
  return {
    id: `p${index}`,
    slug: `product-${index}`,
    name: `Product ${index}`,
    categorySlug: "fruits",
    categoryName: "Fruits",
    price: 1000 + index,
    rating: 4,
    soldCount: 100,
    city: "Kab. Bandung",
    imageUrl: `/images/dummy/product-${index}.jpg`,
    shopName: "Shop",
    ...overrides,
  };
}

function makeBanner(id: string, title: string): Banner {
  return {
    id,
    title,
    subtitle: "Sub",
    buttonLabel: "Shop now",
    linkUrl: "/products",
    imageUrl: `/images/dummy/${id}.jpg`,
  };
}

/** Test data shaped like the result of getHomeSections(). */
export function makeHomeData(): HomeSectionsData {
  return {
    banners: {
      carousel: [makeBanner("c1", "BIG SALE"), makeBanner("c2", "SUPER SALE")],
      promoStrips: [makeBanner("s1", "Healthy Fruits"), makeBanner("s2", "Fresh Veggies")],
      sideBanners: [makeBanner("b1", "Fitness"), makeBanner("b2", "We eat")],
      verticalBanners: [makeBanner("v1", "Vertical")],
    },
    categories: [
      { id: "1", slug: "seeds", name: "Seeds", iconKey: "seeds" },
      { id: "2", slug: "fruits", name: "Fruits", iconKey: "fruits" },
    ],
    popularProducts: Array.from({ length: 8 }, (_, i) => makeProduct(i + 1)),
    fruits: Array.from({ length: 4 }, (_, i) => makeProduct(i + 20)),
    equipments: Array.from({ length: 4 }, (_, i) => makeProduct(i + 30, { categorySlug: "equipments" })),
  };
}
