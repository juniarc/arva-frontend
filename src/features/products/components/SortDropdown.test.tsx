import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SortDropdown } from "./SortDropdown";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => push.mockReset());

describe("SortDropdown", () => {
  it("shows 'Most Suitable' by default and lists the five options", async () => {
    const user = userEvent.setup();
    render(<SortDropdown query={{ page: 1 }} />);

    const button = screen.getByRole("button", { name: /Most Suitable/ });
    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Most Suitable",
      "Newest",
      "Most Popular",
      "Price : High to Low",
      "Price : Low to High",
    ]);
  });

  it("updates the URL with the chosen sort and goes back to page 1", async () => {
    const user = userEvent.setup();
    render(<SortDropdown query={{ category: "fruits", page: 4 }} />);

    await user.click(screen.getByRole("button", { name: /Most Suitable/ }));
    await user.click(screen.getByRole("option", { name: "Price : High to Low" }));

    expect(push).toHaveBeenCalledWith("/products?category=fruits&sort=price_desc", { scroll: false });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("choosing 'Most Suitable' removes the sort from the URL", async () => {
    const user = userEvent.setup();
    render(<SortDropdown query={{ sort: "newest", page: 1 }} />);

    await user.click(screen.getByRole("button", { name: /Newest/ }));
    await user.click(screen.getByRole("option", { name: "Most Suitable" }));

    expect(push).toHaveBeenCalledWith("/products", { scroll: false });
  });

  it("closes with Escape", async () => {
    const user = userEvent.setup();
    render(<SortDropdown query={{ page: 1 }} />);

    await user.click(screen.getByRole("button", { name: /Most Suitable/ }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
