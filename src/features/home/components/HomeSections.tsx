import { BelowDesktop, DesktopOnly } from "@/components/layout/ResponsiveOnly";
import type { HomeSectionsData } from "../types";
import { BrowseCategories } from "./BrowseCategories";
import { CategoryRow } from "./CategoryRow";
import { CategorySidebar } from "./CategorySidebar";
import { HeroCarousel } from "./HeroCarousel";
import { ProductSection } from "./ProductSection";
import { PromoStrip } from "./PromoStrip";

interface HomeSectionsProps {
  data: HomeSectionsData;
  /** Lets the product cards decide between opening the add-to-cart modal and sending guests to /login. */
  isLoggedIn?: boolean;
}

/** Puts the home page sections in order. All data comes in through `data`. */
export function HomeSections({ data, isLoggedIn = false }: HomeSectionsProps) {
  const { banners, categories } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
      <h1 className="sr-only">Arva: fresh produce, seeds and farming supplies</h1>

      <HeroCarousel slides={banners.carousel} sideBanners={banners.sideBanners} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <DesktopOnly className="self-start lg:sticky lg:top-4">
          <CategorySidebar categories={categories} banners={banners.verticalBanners} />
        </DesktopOnly>

        <div className="flex min-w-0 flex-col gap-8">
          <BelowDesktop>
            <CategoryRow categories={categories} />
          </BelowDesktop>

          <ProductSection
            title="Popular Products"
            viewAllHref="/products?sort=popular"
            products={data.popularProducts}
            isLoggedIn={isLoggedIn}
          />

          {banners.promoStrips.length > 0 && (
            <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] md:grid md:grid-cols-2 md:gap-4 md:overflow-visible">
              {banners.promoStrips.map((strip) => (
                <li key={strip.id} className="w-[85%] shrink-0 snap-start md:w-auto">
                  <PromoStrip strip={strip} />
                </li>
              ))}
            </ul>
          )}

          <ProductSection
            title="Fruits"
            viewAllHref="/products?category=fruits"
            products={data.fruits}
            isLoggedIn={isLoggedIn}
          />

          <DesktopOnly>
            <BrowseCategories categories={categories} />
          </DesktopOnly>

          <DesktopOnly>
            <ProductSection
              title="Equipments"
              viewAllHref="/products?category=equipments"
              products={data.equipments}
              isLoggedIn={isLoggedIn}
            />
          </DesktopOnly>
        </div>
      </div>
    </div>
  );
}
