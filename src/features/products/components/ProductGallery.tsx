"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, type TouchEvent } from "react";
import { PLACEHOLDER_IMAGE, SafeImage } from "@/components/ui/SafeImage";
import type { ProductImage } from "../types";
import { BackButton } from "./BackButton";

const SWIPE_MIN_PX = 40;
const SCROLL_STEP_PX = 240;
/** Thumbnails that fit in the desktop column. Arrows only show when there are more. */
const THUMBS_THAT_FIT = 6;

/**
 * Main image with a thumbnail strip. The main image has a fixed height (or aspect ratio on desktop),
 * so the page does not jump while it loads. On mobile and tablet it also holds the back button.
 */
export function ProductGallery({ images: apiImages }: { images: ProductImage[] }) {
  // A product without images still shows a placeholder, so the layout keeps its shape.
  const images = apiImages.length > 0 ? apiImages : [{ id: "placeholder", url: PLACEHOLDER_IMAGE, alt: "" }];
  const [index, setIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const current = images[index] ?? images[0];
  if (!current) return null;

  const goTo = (next: number) => setIndex(((next % images.length) + images.length) % images.length);

  const handleTouchEnd = (event: TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    const end = event.changedTouches[0]?.clientX;
    if (start === null || end === undefined || images.length < 2) return;

    if (start - end > SWIPE_MIN_PX) goTo(index + 1);
    else if (end - start > SWIPE_MIN_PX) goTo(index - 1);
  };

  const scrollStrip = (direction: 1 | -1) =>
    stripRef.current?.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: "smooth" });

  return (
    <div>
      <div
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={handleTouchEnd}
        className="relative h-94 w-full overflow-hidden bg-surface md:h-120 lg:aspect-square lg:h-auto lg:rounded-md"
      >
        <SafeImage
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(min-width: 1024px) 480px, 100vw"
          className="object-cover"
        />
        <BackButton className="absolute left-3 top-3 z-10 lg:hidden" />
      </div>

      <div className="relative mt-3 px-4 lg:px-0">
        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:gap-3"
        >
          {images.map((image, position) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Show image ${position + 1}`}
              aria-pressed={position === index}
              onClick={() => setIndex(position)}
              className={`relative size-12 shrink-0 overflow-hidden rounded-sm bg-surface md:size-14 ${
                position === index ? "border-2 border-brand" : "border border-line/40"
              } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info`}
            >
              <SafeImage src={image.url} alt="" fill sizes="3.5rem" className="object-cover" />
            </button>
          ))}
        </div>

        {images.length > THUMBS_THAT_FIT && (
          <>
            <button
              type="button"
              aria-label="Scroll thumbnails left"
              onClick={() => scrollStrip(-1)}
              className="absolute left-0 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm lg:flex"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Scroll thumbnails right"
              onClick={() => scrollStrip(1)}
              className="absolute right-0 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm lg:flex"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
