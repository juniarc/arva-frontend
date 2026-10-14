import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyProducts } from "./EmptyProducts";

describe("EmptyProducts", () => {
  it("explains that nothing matches and offers 'Reset filters', which clears every filter", () => {
    render(<EmptyProducts />);

    expect(screen.getByText("No products match these filters.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reset filters" })).toHaveAttribute("href", "/products");
  });

  it("names the search when there is one", () => {
    render(<EmptyProducts search="xyzzy" />);
    expect(screen.getByText('No products match "xyzzy". Try other words, or fewer filters.')).toBeInTheDocument();
  });
});
