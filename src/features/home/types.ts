import type { Product } from "@/features/products/types";

export interface HeroSlide {
  id: string;
  title: string;
  badge?: string;
  subtitle?: string;
  /** Small line at the bottom, e.g. "Go shop online: www.web.com". */
  footnote?: string;
  imageUrl: string;
}

export interface SideBanner {
  id: string;
  imageUrl: string;
  alt: string;
}

export interface PromoStripData {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  imageUrl: string;
}

export interface HomeSectionsData {
  hero: {
    desktopSlides: HeroSlide[];
    mobileSlides: HeroSlide[];
    sideBanners: SideBanner[];
  };
  sidebarBannerUrl: string;
  popularProducts: Product[];
  promoStrips: PromoStripData[];
  fruits: Product[];
  equipments: Product[];
}
