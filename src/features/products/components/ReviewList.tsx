"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { fetchReviews } from "../api/products";
import { REVIEWS_PAGE_SIZE } from "../constants";
import type { ProductReview } from "../types";
import { ReviewCard } from "./ReviewCard";

interface ReviewListProps {
  slug: string;
  /** The first reviews, newest first (the product's `reviewPreview`). */
  initialReviews: ProductReview[];
  /** How many reviews the product has in total. */
  totalCount: number;
}

const TOGGLE_BUTTON =
  "mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-mint text-sm text-ink " +
  "hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Shows the first review, with a toggle to show or hide the rest.
 * When the product has more reviews than the preview holds, "Load more reviews" fetches the next page.
 */
export function ReviewList({ slug, initialReviews, totalCount }: ReviewListProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listId = useId();

  const visible = expanded ? reviews : reviews.slice(0, 1);
  const Chevron = expanded ? ChevronUp : ChevronDown;
  const canLoadMore = expanded && reviews.length < totalCount;

  const loadMore = async () => {
    setLoading(true);
    setError(null);

    const nextPage = Math.floor(reviews.length / REVIEWS_PAGE_SIZE) + 1;
    const result = await fetchReviews(slug, nextPage);
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    // Skip reviews we already have, in case a new one was posted between the two requests.
    setReviews((current) => {
      const known = new Set(current.map((review) => review.id));
      return [...current, ...result.reviews.filter((review) => !known.has(review.id))];
    });
  };

  if (reviews.length === 0) return <p className="text-sm text-muted">No reviews yet.</p>;

  return (
    <div>
      <ul id={listId} className="flex flex-col gap-3">
        {visible.map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} />
          </li>
        ))}
      </ul>

      {error && <Alert variant="error" message={error} className="mt-3" />}

      {canLoadMore && (
        <button type="button" onClick={loadMore} disabled={loading} className={TOGGLE_BUTTON}>
          {loading ? "Loading..." : "Load more reviews"}
        </button>
      )}

      {reviews.length > 1 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((current) => !current)}
          className={TOGGLE_BUTTON}
        >
          {expanded ? "Hide reviews" : "View all reviews"}
          <Chevron className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
