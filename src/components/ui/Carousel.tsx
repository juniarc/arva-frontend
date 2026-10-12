"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";

export interface CarouselSlide {
  id: string;
  content: ReactNode;
}

interface CarouselProps {
  slides: CarouselSlide[];
  /** Accessible name of the whole carousel. */
  label: string;
  /** Milliseconds between automatic slides. */
  autoplayMs?: number;
  /** Give the carousel a fixed aspect ratio here (e.g. "aspect-[16/9]") so the layout never shifts. */
  className?: string;
}

const NAV_BUTTON =
  "absolute top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink " +
  "hover:bg-white focus-visible:outline-2 focus-visible:outline-info md:flex";

/**
 * Generic fading carousel. Autoplay pauses on hover and focus, and is off when the
 * user prefers reduced motion. Arrow keys change slides.
 */
export function Carousel({ slides, label, autoplayMs = 5000, className = "" }: CarouselProps) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    // `index` is a dependency so the timer restarts after a manual change.
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), autoplayMs);
    return () => clearInterval(timer);
  }, [paused, count, autoplayMs, index]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") goTo(index + 1);
    if (event.key === "ArrowLeft") goTo(index - 1);
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={handleBlur}
      className={`relative overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-info ${className}`}
    >
      <div className="absolute inset-0" aria-live={paused ? "polite" : "off"}>
        {slides.map((slide, position) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${position + 1} of ${count}`}
            aria-hidden={position !== index}
            inert={position !== index}
            className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${
              position === index ? "opacity-100" : "opacity-0"
            }`}
          >
            {slide.content}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(index - 1)}
            className={`${NAV_BUTTON} left-2`}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(index + 1)}
            className={`${NAV_BUTTON} right-2`}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </>
      )}

      <div className="absolute inset-x-0 bottom-1 flex justify-center">
        {slides.map((slide, position) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to slide ${position + 1}`}
            aria-current={position === index}
            onClick={() => goTo(position)}
            className="flex size-8 items-center justify-center focus-visible:outline-2 focus-visible:outline-info"
          >
            <span
              className={`size-2 rounded-full transition-colors ${position === index ? "bg-brand" : "bg-white/80"}`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
