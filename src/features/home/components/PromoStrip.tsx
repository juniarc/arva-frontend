import { ButtonLink } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import type { Banner } from "../types";

/** Yellow promo strip with a title, subtitle, button and an image on the right. */
export function PromoStrip({ strip }: { strip: Banner }) {
  return (
    <div className="relative flex min-h-32 items-center overflow-hidden rounded-md bg-promo p-4">
      <div className="relative z-10 flex flex-col items-start gap-1">
        <p className="font-serif text-xl font-bold text-ink">{strip.title}</p>
        {strip.subtitle && <p className="text-xs text-ink">{strip.subtitle}</p>}
        {strip.buttonLabel && strip.linkUrl && (
          <ButtonLink href={strip.linkUrl} variant="brand" className="mt-2 w-auto text-xs uppercase">
            {strip.buttonLabel}
          </ButtonLink>
        )}
      </div>
      <div className="absolute inset-y-0 right-0 w-1/2">
        <SafeImage src={strip.imageUrl} alt="" fill sizes="25vw" className="object-cover" />
      </div>
    </div>
  );
}
