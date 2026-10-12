import { Star } from "lucide-react";
import type { ReviewSummary as ReviewSummaryData } from "../types";

/** "3.4 from 212 ratings . 104 reviews" */
export function ReviewSummary({ summary }: { summary: ReviewSummaryData }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
      <Star className="size-4 fill-star text-star" aria-hidden="true" />
      <span className="text-sm font-bold text-ink">{summary.averageRating.toFixed(1)}</span>
      <span>from {summary.ratingCount} ratings</span>
      <span aria-hidden="true">&bull;</span>
      <span>{summary.reviewCount} reviews</span>
    </p>
  );
}
