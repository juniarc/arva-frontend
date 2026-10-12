"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState } from "react";
import type { ProductReview } from "../types";
import { ReviewCard } from "./ReviewCard";

/** Shows the first review, with a toggle to show or hide the rest. */
export function ReviewList({ reviews }: { reviews: ProductReview[] }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const visible = expanded ? reviews : reviews.slice(0, 1);
  const Chevron = expanded ? ChevronUp : ChevronDown;

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

      {reviews.length > 1 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-mint text-sm text-ink hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
        >
          {expanded ? "Hide reviews" : "View all reviews"}
          <Chevron className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
