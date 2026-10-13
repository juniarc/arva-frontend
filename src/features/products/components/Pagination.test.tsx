import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getPageItems } from "../query/page-items";
import { Pagination } from "./Pagination";

describe("getPageItems", () => {
  it("shows every page when there are 5 or fewer", () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("shows 5 numbers and an ellipsis at the end near the start", () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis"]);
    expect(getPageItems(3, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis"]);
  });

  it("shows ellipses on both sides in the middle", () => {
    expect(getPageItems(10, 20)).toEqual(["ellipsis", 8, 9, 10, 11, 12, "ellipsis"]);
  });

  it("shows an ellipsis at the start near the end", () => {
    expect(getPageItems(20, 20)).toEqual(["ellipsis", 16, 17, 18, 19, 20]);
  });
});

describe("Pagination", () => {
  it("marks the current page and links the others, keeping the filters", () => {
    render(<Pagination query={{ category: "fruits", discount: true, page: 2 }} currentPage={2} totalPages={3} />);

    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByText("2")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Page 3" })).toHaveAttribute("href", "/products?category=fruits&discount=true&page=3");
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute("href", "/products?category=fruits&discount=true");
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "/products?category=fruits&discount=true");
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/products?category=fruits&discount=true&page=3");
  });

  it("has no previous link on the first page and no next link on the last", () => {
    const { rerender } = render(<Pagination query={{ page: 1 }} currentPage={1} totalPages={2} />);
    expect(screen.queryByRole("link", { name: "Previous page" })).not.toBeInTheDocument();

    rerender(<Pagination query={{ page: 2 }} currentPage={2} totalPages={2} />);
    expect(screen.queryByRole("link", { name: "Next page" })).not.toBeInTheDocument();
  });

  it("renders nothing for a single page", () => {
    const { container } = render(<Pagination query={{ page: 1 }} currentPage={1} totalPages={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});
