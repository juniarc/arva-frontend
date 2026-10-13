import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Category } from "../types";
import { FilterSidebar } from "./FilterSidebar";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const categories: Category[] = [
  { id: "1", slug: "seeds", name: "Seeds", iconKey: "seeds" },
  { id: "3", slug: "fruits", name: "Fruits", iconKey: "fruits" },
];

beforeEach(() => push.mockReset());

describe("FilterSidebar", () => {
  it("sets the category in the URL and goes back to page 1", async () => {
    const user = userEvent.setup();
    render(<FilterSidebar query={{ page: 3, discount: true }} categories={categories} />);

    await user.click(screen.getByRole("button", { name: "Fruits" }));

    expect(push).toHaveBeenCalledWith("/products?category=fruits&discount=true", { scroll: false });
  });

  it("clears the category when the selected one is clicked again", async () => {
    const user = userEvent.setup();
    render(<FilterSidebar query={{ category: "fruits", page: 1 }} categories={categories} />);

    const selected = screen.getByRole("button", { name: "Fruits" });
    expect(selected).toHaveAttribute("aria-pressed", "true");
    await user.click(selected);

    expect(push).toHaveBeenCalledWith("/products", { scroll: false });
  });

  it("toggles discount, rating and location", async () => {
    const user = userEvent.setup();
    render(<FilterSidebar query={{ page: 1 }} categories={categories} />);

    await user.click(screen.getByRole("button", { name: "Discount Products" }));
    expect(push).toHaveBeenLastCalledWith("/products?discount=true", { scroll: false });

    await user.click(screen.getByRole("button", { name: "Rating above 4" }));
    expect(push).toHaveBeenLastCalledWith("/products?minRating=4", { scroll: false });

    await user.click(screen.getByRole("button", { name: "DKI Jakarta" }));
    expect(push).toHaveBeenLastCalledWith("/products?city=Jakarta", { scroll: false });
  });

  it("applies a price range on blur", async () => {
    const user = userEvent.setup();
    render(<FilterSidebar query={{ page: 2 }} categories={categories} />);

    await user.type(screen.getByLabelText("Lowest Price"), "5000");
    await user.type(screen.getByLabelText("Highest Price"), "9000");
    await user.tab();

    expect(push).toHaveBeenLastCalledWith("/products?minPrice=5000&maxPrice=9000", { scroll: false });
  });

  it("shows a linked error and does not apply when the minimum is above the maximum", async () => {
    const user = userEvent.setup();
    render(<FilterSidebar query={{ page: 1 }} categories={categories} />);

    await user.type(screen.getByLabelText("Lowest Price"), "9000");
    await user.type(screen.getByLabelText("Highest Price"), "1000");
    await user.tab();

    expect(await screen.findByRole("alert")).toHaveTextContent("Lowest price cannot be higher than highest price.");
    expect(screen.getByLabelText("Highest Price")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Highest Price")).toHaveAccessibleDescription("Lowest price cannot be higher than highest price.");
    // Only the first field was applied (on its own, it is a valid range). The invalid pair never was.
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/products?minPrice=9000", { scroll: false });
  });

  it("collapses a section with its heading button", async () => {
    const user = userEvent.setup();
    render(<FilterSidebar query={{ page: 1 }} categories={categories} />);

    const toggle = screen.getByRole("button", { name: "Category" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Fruits" })).not.toBeInTheDocument();
  });
});
