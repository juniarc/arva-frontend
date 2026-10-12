import { Star } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import type { ProductReview } from "../types";

const STARS = [1, 2, 3, 4, 5];

/** One review: avatar, username, stars, relative date and text. */
export function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <article className="rounded-md border border-line/40 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-sm font-bold text-white">
          {review.avatarUrl ? (
            <SafeImage src={review.avatarUrl} alt="" fill sizes="2rem" className="object-cover" />
          ) : (
            <span aria-hidden="true">{review.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink">{review.username}</h3>
          <p className="flex items-center gap-2 text-[10px] text-muted">
            <span className="flex" role="img" aria-label={`Rated ${review.rating} out of 5`}>
              {STARS.map((star) => (
                <Star
                  key={star}
                  className={`size-3 ${star <= review.rating ? "fill-star text-star" : "text-line"}`}
                  aria-hidden="true"
                />
              ))}
            </span>
            {review.createdAgo}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink">{review.text}</p>
    </article>
  );
}
