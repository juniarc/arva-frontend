import { Carousel } from "@/components/ui/Carousel";
import { SafeImage } from "@/components/ui/SafeImage";
import { BelowDesktop, DesktopOnly } from "@/components/layout/ResponsiveOnly";
import type { HeroSlide, SideBanner } from "../types";

interface HeroCarouselProps {
  desktopSlides: HeroSlide[];
  mobileSlides: HeroSlide[];
  sideBanners: SideBanner[];
}

function SlideView({ slide }: { slide: HeroSlide }) {
  return (
    <div className="relative size-full bg-mint">
      {/* Decorative: the slide text carries the message. */}
      <SafeImage src={slide.imageUrl} alt="" fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-mint/90 via-mint/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center gap-1 p-5 text-brand md:gap-3 md:p-10">
        <p className="text-3xl font-black leading-none md:text-6xl">{slide.title}</p>
        {slide.badge && (
          <p className="w-fit rounded-full bg-brand px-3 py-1 text-xs font-bold text-white md:text-xl">{slide.badge}</p>
        )}
        {slide.subtitle && <p className="text-xs font-semibold md:text-xl">{slide.subtitle}</p>}
        {slide.footnote && <p className="text-[10px] md:text-sm">{slide.footnote}</p>}
      </div>
    </div>
  );
}

/**
 * Desktop: main carousel plus two static banners. Mobile and tablet: one full-width carousel.
 * Both carousels have a fixed aspect ratio so the page does not jump while images load.
 */
export function HeroCarousel({ desktopSlides, mobileSlides, sideBanners }: HeroCarouselProps) {
  return (
    <>
      <DesktopOnly className="lg:grid lg:grid-cols-3 lg:gap-4">
        <Carousel
          label="Featured offers"
          className="aspect-[16/9] lg:col-span-2"
          slides={desktopSlides.map((slide) => ({ id: slide.id, content: <SlideView slide={slide} /> }))}
        />
        <div className="flex flex-col gap-4">
          {sideBanners.map((banner) => (
            <div key={banner.id} className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-promo">
              <SafeImage src={banner.imageUrl} alt={banner.alt} fill sizes="33vw" className="object-cover" />
            </div>
          ))}
        </div>
      </DesktopOnly>

      <BelowDesktop>
        <Carousel
          label="Featured offers"
          className="aspect-[5/3]"
          slides={mobileSlides.map((slide) => ({ id: slide.id, content: <SlideView slide={slide} /> }))}
        />
      </BelowDesktop>
    </>
  );
}
