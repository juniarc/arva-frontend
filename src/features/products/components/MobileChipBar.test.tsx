import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Category } from "../types";
import { MobileChipBar } from "./MobileChipBar";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const categories: Category[] = [
  { id: "1", slug: "seeds", name: "Seeds", iconKey: "seeds" },
  { id: "3", slug: "fruits", name: "Fruits", iconKey: "fruits" },
];

type User = ReturnType<typeof userEvent.setup>;
const openFilter = (user: User) => user.click(screen.getByRole("button", { name: "Filter" }));
const dialog = () => screen.getByRole("dialog");

beforeEach(() => push.mockReset());

describe("MobileChipBar", () => {
  it("shows the selected city and category on the chips", () => {
    render(<MobileChipBar query={{ category: "fruits", city: "Jakarta", page: 1 }} categories={categories} />);

    expect(screen.getByRole("button", { name: "DKI Jakarta" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Fruits" })).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles the discount chip straight away", async () => {
    const user = userEvent.setup();
    render(<MobileChipBar query={{ page: 2 }} categories={categories} />);

    await user.click(screen.getByRole("button", { name: "Discount" }));

    expect(push).toHaveBeenCalledWith("/products?discount=true", { scroll: false });
  });
});

describe("filter sheet", () => {
  it("holds changes until 'Show Products' is pressed, then updates the URL and closes", async () => {
    const user = userEvent.setup();
    render(<MobileChipBar query={{ page: 3 }} categories={categories} />);

    await openFilter(user);
    await user.click(within(dialog()).getByRole("button", { name: "Fruits" }));
    await user.click(within(dialog()).getByRole("button", { name: "Discounted Products" }));
    await user.type(within(dialog()).getByLabelText("Lowest"), "2000");

    expect(push).not.toHaveBeenCalled();

    await user.click(within(dialog()).getByRole("button", { name: "Show Products" }));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/products?category=fruits&discount=true&minPrice=2000", { scroll: false });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("clears the draft with Reset", async () => {
    const user = userEvent.setup();
    render(<MobileChipBar query={{ category: "fruits", discount: true, minPrice: 1000, page: 1 }} categories={categories} />);

    await openFilter(user);
    expect(within(dialog()).getByRole("button", { name: "Fruits" })).toHaveAttribute("aria-pressed", "true");

    await user.click(within(dialog()).getByRole("button", { name: "Reset" }));
    expect(within(dialog()).getByRole("button", { name: "Fruits" })).toHaveAttribute("aria-pressed", "false");
    expect(within(dialog()).getByLabelText("Lowest")).toHaveValue("");
    expect(push).not.toHaveBeenCalled();

    await user.click(within(dialog()).getByRole("button", { name: "Show Products" }));
    expect(push).toHaveBeenCalledWith("/products", { scroll: false });
  });

  it("blocks 'Show Products' when the lowest price is above the highest", async () => {
    const user = userEvent.setup();
    render(<MobileChipBar query={{ page: 1 }} categories={categories} />);

    await openFilter(user);
    await user.type(within(dialog()).getByLabelText("Lowest"), "9000");
    await user.type(within(dialog()).getByLabelText("Highest"), "1000");

    expect(within(dialog()).getByRole("alert")).toHaveTextContent("Lowest price cannot be higher");
    expect(within(dialog()).getByRole("button", { name: "Show Products" })).toBeDisabled();
  });

  it("drops the unsaved draft when the sheet is closed and opened again", async () => {
    const user = userEvent.setup();
    render(<MobileChipBar query={{ page: 1 }} categories={categories} />);

    await openFilter(user);
    await user.click(within(dialog()).getByRole("button", { name: "Fruits" }));
    await user.click(within(dialog()).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await openFilter(user);
    expect(within(dialog()).getByRole("button", { name: "Fruits" })).toHaveAttribute("aria-pressed", "false");
  });

  it("closes with Escape and returns focus to the Filter button", async () => {
    const user = userEvent.setup();
    render(<MobileChipBar query={{ page: 1 }} categories={categories} />);

    const trigger = screen.getByRole("button", { name: "Filter" });
    await user.click(trigger);
    expect(dialog()).toBeInTheDocument();

    // A real browser moves focus into the modal dialog; jsdom does not, so do it here.
    within(dialog()).getByRole("button", { name: "Close" }).focus();
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});

describe("sort sheet", () => {
  it("shows the options as radios with the current one selected", async () => {
    const user = userEvent.setup();
    render(<MobileChipBar query={{ sort: "newest", page: 1 }} categories={categories} />);

    await user.click(screen.getByRole("button", { name: "Short by" }));

    const group = screen.getByRole("radiogroup", { name: "Short By" });
    expect(within(group).getAllByRole("radio")).toHaveLength(5);
    expect(within(group).getByRole("radio", { name: "Newest" })).toBeChecked();
  });

  it("applies the choice straight away and closes", async () => {
    const user = userEvent.setup();
    render(<MobileChipBar query={{ category: "fruits", page: 2 }} categories={categories} />);

    await user.click(screen.getByRole("button", { name: "Short by" }));
    await user.click(screen.getByRole("radio", { name: "Price : Low to High" }));

    expect(push).toHaveBeenCalledWith("/products?category=fruits&sort=price_asc", { scroll: false });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes with Escape and returns focus to the sort button", async () => {
    const user = userEvent.setup();
    render(<MobileChipBar query={{ page: 1 }} categories={categories} />);

    const trigger = screen.getByRole("button", { name: "Short by" });
    await user.click(trigger);
    within(dialog()).getByRole("button", { name: "Close" }).focus();
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(push).not.toHaveBeenCalled();
  });
});
