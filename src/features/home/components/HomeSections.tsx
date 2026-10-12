import { BelowDesktop, DesktopOnly } from "@/components/layout/ResponsiveOnly";
import type { HomeSectionsData } from "../types";
import { BrowseCategories } from "./BrowseCategories";
import { CategoryRow } from "./CategoryRow";
import { CategorySidebar } from "./CategorySidebar";
import { HeroCarousel } from "./HeroCarousel";
import { ProductSection } from "./ProductSection";
import { PromoStrip } from "./PromoStrip";

/** Puts the home page sections in order. All data comes in through `data`. */
export function HomeSections({ data, isLoggedIn = false }: { data: HomeSectionsData; isLoggedIn?: boolean }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
      <h1 className="sr-only">Arva: fresh produce, seeds and farming supplies</h1>

      <HeroCarousel {...data.hero} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <DesktopOnly className="self-start lg:sticky lg:top-4">
          <CategorySidebar bannerUrl={data.sidebarBannerUrl} />
        </DesktopOnly>

        <div className="flex min-w-0 flex-col gap-8">
          <BelowDesktop>
            <CategoryRow />
          </BelowDesktop>

          <ProductSection title="Popular Products" viewAllHref="/products?sort=popular" products={data.popularProducts}
            isLoggedIn={isLoggedIn}
          />

          <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] md:grid md:grid-cols-2 md:gap-4 md:overflow-visible">
            {data.promoStrips.map((strip) => (
              <li key={strip.id} className="w-[85%] shrink-0 snap-start md:w-auto">
                <PromoStrip strip={strip} />
              </li>
            ))}
          </ul>

          <ProductSection title="Fruits" viewAllHref="/products?category=fruits" products={data.fruits} isLoggedIn={isLoggedIn} />

          <DesktopOnly>
            <BrowseCategories />
          </DesktopOnly>

          <DesktopOnly>
            <ProductSection title="Equipments" viewAllHref="/products?category=equipments" products={data.equipments}
              isLoggedIn={isLoggedIn}
            />
          </DesktopOnly>
        </div>
      </div>
    </div>
  );
}
