import type { ProductReview, ReviewSummary } from "../types";

/**
 * Sample reviews. The backend has no reviews endpoint yet (see "Planned endpoint groups" in CLAUDE.md),
 * so every product shows the same sample reviews. Replace with an API call when /reviews exists.
 */

const REVIEW_TEXT =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore " +
  "magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.";

export const DUMMY_REVIEWS: ProductReview[] = [
  { id: "r1", username: "username", avatarUrl: "/images/dummy/avatar-1.jpg", rating: 4, createdAgo: "1 week ago", text: REVIEW_TEXT },
  { id: "r2", username: "username", avatarUrl: "/images/dummy/avatar-1.jpg", rating: 4, createdAgo: "1 week ago", text: REVIEW_TEXT },
  { id: "r3", username: "username", avatarUrl: "/images/dummy/avatar-1.jpg", rating: 3, createdAgo: "1 week ago", text: REVIEW_TEXT },
];

export function getDummyReviewSummary(averageRating: number): ReviewSummary {
  return { averageRating, ratingCount: 212, reviewCount: 104 };
}
