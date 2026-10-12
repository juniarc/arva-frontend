import { DUMMY_PRODUCTS } from "@/features/products/data/dummy-products";
import type { HomeSectionsData } from "../types";

/**
 * Returns everything the home page shows.
 * It returns dummy data for now. Replace the body with an API call when the backend is ready;
 * the return type is the contract the components depend on.
 */
export async function getHomeSections(): Promise<HomeSectionsData> {
  const popularProducts = [...DUMMY_PRODUCTS].sort((a, b) => b.soldCount - a.soldCount).slice(0, 8);

  return {
    hero: {
      desktopSlides: [
        {
          id: "big-sale",
          title: "BIG SALE",
          badge: "50% OFF",
          subtitle: "Products for vegetarians",
          footnote: "Go shop online: www.web.com",
          imageUrl: "/images/dummy/hero-big-sale.jpg",
        },
        {
          id: "fresh-harvest",
          title: "FRESH HARVEST",
          badge: "NEW",
          subtitle: "Straight from the farm to your table",
          imageUrl: "/images/dummy/hero-fresh-harvest.jpg",
        },
      ],
      mobileSlides: [
        {
          id: "super-sale",
          title: "SUPER SALE",
          badge: "UP TO 60% OFF",
          imageUrl: "/images/dummy/hero-super-sale.jpg",
        },
      ],
      sideBanners: [
        { id: "fitness", imageUrl: "/images/dummy/banner-fitness.jpg", alt: "Fitness nutrition, healthy food" },
        { id: "we-eat", imageUrl: "/images/dummy/banner-we-eat.jpg", alt: "We are what we eat" },
      ],
    },
    sidebarBannerUrl: "/images/dummy/banner-sidebar.jpg",
    popularProducts,
    promoStrips: [
      {
        id: "healthy-fruits-1",
        title: "Healthy Fruits",
        subtitle: "Save up to 20% off",
        ctaLabel: "SHOP NOW",
        href: "/products?category=fruits",
        imageUrl: "/images/dummy/promo-fruits.jpg",
      },
      {
        id: "healthy-fruits-2",
        title: "Healthy Fruits",
        subtitle: "Save up to 20% off",
        ctaLabel: "SHOP NOW",
        href: "/products?category=fruits",
        imageUrl: "/images/dummy/promo-fruits.jpg",
      },
    ],
    fruits: DUMMY_PRODUCTS.filter((product) => product.categorySlug === "fruits").slice(0, 4),
    equipments: DUMMY_PRODUCTS.filter((product) => product.categorySlug === "equipments").slice(0, 4),
  };
}
