import Link from "next/link";
import { Carousel } from "@/components/ui/Carousel";
import { SafeImage } from "@/components/ui/SafeImage";
import type { Banner } from "../types";
import { BannerFrame } from "./BannerFrame";

interface HeroCarouselProps {
  slides: Banner[];
  sideBanners: Banner[];
}

function SlideView({ slide }: { slide: Banner }) {
  return (
    <div className="relative size-full bg-mint">
      {/* Decorative: the slide text carries the message. */}
      <SafeImage src={slide.imageUrl} alt="" fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-mint/90 via-mint/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-start justify-center gap-1 p-5 text-brand md:gap-3 md:p-10">
        <p className="text-3xl font-black leading-none md:text-6xl">{slide.title}</p>
        {slide.subtitle && <p className="text-xs font-semibold md:text-xl">{slide.subtitle}</p>}
        {slide.buttonLabel && slide.linkUrl && (
          <Link
            href={slide.linkUrl}
            className="mt-1 flex min-h-11 items-center rounded-sm bg-brand px-4 text-xs font-bold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info md:text-sm"
          >
            {slide.buttonLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * One carousel with a fixed aspect ratio, so the page does not jump while images load.
 * On desktop the static side banners sit to its right.
 */
export function HeroCarousel({ slides, sideBanners }: HeroCarouselProps) {
  if (slides.length === 0) return null;

  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-4">
      <Carousel
        label="Featured offers"
        className="aspect-[5/3] lg:col-span-2 lg:aspect-[16/9]"
        slides={slides.map((slide) => ({ id: slide.id, content: <SlideView slide={slide} /> }))}
      />
      <div className="hidden flex-col gap-4 lg:flex">
        {sideBanners.map((banner) => (
          <BannerFrame
            key={banner.id}
            href={banner.linkUrl}
            className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-promo"
          >
            <SafeImage src={banner.imageUrl} alt={banner.title} fill sizes="33vw" className="object-cover" />
          </BannerFrame>
        ))}
      </div>
    </div>
  );
}
