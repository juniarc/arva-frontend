import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DUMMY_REVIEWS } from "../data/dummy-reviews";
import { ReviewList } from "./ReviewList";

describe("ReviewList", () => {
  it("shows one review by default and all of them after 'View all reviews'", async () => {
    const user = userEvent.setup();
    render(<ReviewList reviews={DUMMY_REVIEWS} />);

    expect(screen.getAllByRole("article")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "View all reviews" }));
    expect(screen.getAllByRole("article")).toHaveLength(DUMMY_REVIEWS.length);
    expect(screen.getByRole("button", { name: "Hide reviews" })).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Hide reviews" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("has no toggle for a single review", () => {
    render(<ReviewList reviews={DUMMY_REVIEWS.slice(0, 1)} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the star rating as text for screen readers", () => {
    render(<ReviewList reviews={DUMMY_REVIEWS.slice(0, 1)} />);

    expect(screen.getByRole("img", { name: "Rated 4 out of 5" })).toBeInTheDocument();
  });
});
