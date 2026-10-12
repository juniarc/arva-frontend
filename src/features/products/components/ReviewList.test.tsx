import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchReviews } from "../api/products";
import { ReviewList } from "./ReviewList";
import { TEST_REVIEWS } from "./product-page.fixture";

vi.mock("../api/products", () => ({ fetchReviews: vi.fn() }));

const fetchReviewsMock = vi.mocked(fetchReviews);

beforeEach(() => fetchReviewsMock.mockReset());

function renderList(totalCount: number = TEST_REVIEWS.length, reviews = TEST_REVIEWS) {
  render(<ReviewList slug="bali-banana-fruit" initialReviews={reviews} totalCount={totalCount} />);
  return userEvent.setup();
}

describe("ReviewList", () => {
  it("shows one review by default and all of them after 'View all reviews'", async () => {
    const user = renderList();

    expect(screen.getAllByRole("article")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "View all reviews" }));
    expect(screen.getAllByRole("article")).toHaveLength(TEST_REVIEWS.length);
    expect(screen.getByRole("button", { name: "Hide reviews" })).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Hide reviews" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("has no toggle for a single review", () => {
    renderList(1, TEST_REVIEWS.slice(0, 1));

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the star rating as text for screen readers", () => {
    renderList(1, TEST_REVIEWS.slice(0, 1));

    expect(screen.getByRole("img", { name: "Rated 4 out of 5" })).toBeInTheDocument();
  });

  it("offers no 'Load more' when every review is already loaded", async () => {
    const user = renderList();

    await user.click(screen.getByRole("button", { name: "View all reviews" }));

    expect(screen.queryByRole("button", { name: "Load more reviews" })).not.toBeInTheDocument();
  });

  it("loads the next page when the product has more reviews, skipping ones it already has", async () => {
    const firstPage = Array.from({ length: 10 }, (_, i) => ({ ...TEST_REVIEWS[0]!, id: `a${i}` }));
    fetchReviewsMock.mockResolvedValue({
      ok: true,
      total: 12,
      reviews: [
        { ...TEST_REVIEWS[0]!, id: "a9", text: "Duplicate." },
        { ...TEST_REVIEWS[0]!, id: "b1", text: "A new review." },
      ],
    });
    const user = renderList(12, firstPage);

    expect(screen.queryByRole("button", { name: "Load more reviews" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View all reviews" }));
    await user.click(screen.getByRole("button", { name: "Load more reviews" }));

    expect(fetchReviewsMock).toHaveBeenCalledWith("bali-banana-fruit", 2);
    expect(await screen.findByText("A new review.")).toBeInTheDocument();
    expect(screen.queryByText("Duplicate.")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(11);
  });

  it("shows an error when loading more fails", async () => {
    fetchReviewsMock.mockResolvedValue({ ok: false, message: "Could not load reviews. Please try again." });
    const firstPage = Array.from({ length: 10 }, (_, i) => ({ ...TEST_REVIEWS[0]!, id: `a${i}` }));
    const user = renderList(12, firstPage);

    await user.click(screen.getByRole("button", { name: "View all reviews" }));
    await user.click(screen.getByRole("button", { name: "Load more reviews" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load reviews.");
  });
});
