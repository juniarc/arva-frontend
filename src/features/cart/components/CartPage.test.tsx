import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buyNow, removeItems, updateQuantity } from "../api/cart.client";
import { makeCart, makeCartItem } from "../cart.fixture";
import { CartPage } from "./CartPage";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("../api/cart.client", () => ({
  updateQuantity: vi.fn(),
  removeItems: vi.fn(),
  buyNow: vi.fn(),
}));

const updateMock = vi.mocked(updateQuantity);
const removeMock = vi.mocked(removeItems);
const buyMock = vi.mocked(buyNow);

const a1 = makeCartItem({ id: "a1", name: "Banana", price: 2000, quantity: 2 });
const a2 = makeCartItem({ id: "a2", name: "Mango", price: 1000, quantity: 1 });
const b1 = makeCartItem({ id: "b1", name: "Tomato seeds", price: 500, quantity: 4, shop: { key: "tani", name: "Tani Makmur" } });
const cart = makeCart([a1, a2, b1]);

type User = ReturnType<typeof userEvent.setup>;
const check = (user: User, name: string) => user.click(screen.getByRole("checkbox", { name }));
const clickClear = (user: User) => user.click(screen.getByRole("button", { name: "Clear" }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CartPage", () => {
  it("shows the items grouped by shop", () => {
    render(<CartPage initialCart={cart} />);

    expect(screen.getByRole("heading", { level: 1, name: "Cart" })).toBeInTheDocument();
    const kebun = screen.getByRole("region", { name: "Kebun Bali" });
    expect(within(kebun).getByText("Banana")).toBeInTheDocument();
    expect(within(kebun).getByText("Mango")).toBeInTheDocument();
    const tani = screen.getByRole("region", { name: "Tani Makmur" });
    expect(within(tani).getByText("Tomato seeds")).toBeInTheDocument();
    expect(within(tani).getByText("Rp 500")).toBeInTheDocument();
  });

  it("shows the empty state and hides the summary and select-all row", () => {
    render(<CartPage initialCart={makeCart([])} />);

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start shopping" })).toHaveAttribute("href", "/products");
    expect(screen.queryByText("Shopping Summary")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("totals only the selected items and disables Buy when nothing is selected", async () => {
    const user = userEvent.setup();
    render(<CartPage initialCart={cart} />);

    for (const button of screen.getAllByRole("button", { name: /^Buy/ })) expect(button).toBeDisabled();

    await check(user, "Select item Banana");
    await check(user, "Select item Tomato seeds");

    // 2000 x 2 + 500 x 4 = 6000, shown in the summary and in the mobile bar.
    expect(screen.getAllByText("Rp 6.000")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Buy (2)" })[0]).toBeEnabled();
  });

  it("shows a mixed state on the shop checkbox when only some items are selected", async () => {
    const user = userEvent.setup();
    render(<CartPage initialCart={cart} />);
    const shop = screen.getByRole("checkbox", { name: "Select shop Kebun Bali" });

    await check(user, "Select item Banana");
    expect(shop).toBePartiallyChecked();
    expect(shop).toHaveAttribute("aria-checked", "mixed");

    await check(user, "Select item Mango");
    expect(shop).toBeChecked();
  });

  it("selects and deselects everything with Select all", async () => {
    const user = userEvent.setup();
    render(<CartPage initialCart={cart} />);
    const [selectAll] = screen.getAllByRole("checkbox", { name: "Select all items" });

    await user.click(selectAll!);
    expect(screen.getByRole("checkbox", { name: "Select item Mango" })).toBeChecked();
    expect(screen.getAllByRole("button", { name: "Buy (3)" })[0]).toBeEnabled();

    await user.click(selectAll!);
    expect(screen.getByRole("checkbox", { name: "Select item Mango" })).not.toBeChecked();
  });

  it("disables selection and the stepper for an out-of-stock item", () => {
    render(<CartPage initialCart={makeCart([makeCartItem({ id: "x", name: "Sold out", stock: 0 })])} />);

    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select item Sold out" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  });

  it("stops '+' at the stock", () => {
    render(<CartPage initialCart={makeCart([makeCartItem({ quantity: 1, stock: 1 })])} />);

    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  });

  it("turns '-' into a remove button at quantity 1 and removes the item", async () => {
    const user = userEvent.setup();
    removeMock.mockResolvedValue({ ok: true, cart: makeCart([a2, b1]) });
    render(<CartPage initialCart={makeCart([makeCartItem({ id: "a1", name: "Banana", quantity: 1 }), a2, b1])} />);

    // Rows with quantity above 1 still show a normal "-".
    expect(screen.getAllByRole("button", { name: "Remove item" })).toHaveLength(2);
    await user.click(within(screen.getByRole("region", { name: "Kebun Bali" })).getAllByRole("button", { name: "Remove item" })[0]!);

    expect(removeMock).toHaveBeenCalledWith(["a1"]);
    expect(updateMock).not.toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent("Items removed from cart.");
    expect(screen.queryByText("Banana")).not.toBeInTheDocument();
  });

  it("keeps the item and shows an error when removing with '-' fails", async () => {
    const user = userEvent.setup();
    removeMock.mockResolvedValue({ ok: false, message: "Could not remove the items. Please try again." });
    render(<CartPage initialCart={makeCart([makeCartItem({ id: "a1", name: "Banana", quantity: 1 })])} />);

    await user.click(screen.getByRole("button", { name: "Remove item" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not remove the items.");
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove item" })).toBeEnabled();
  });

  it("lets an out-of-stock item be removed with '-'", async () => {
    const user = userEvent.setup();
    removeMock.mockResolvedValue({ ok: true, cart: makeCart([]) });
    render(<CartPage initialCart={makeCart([makeCartItem({ id: "x", quantity: 1, stock: 0 })])} />);

    await user.click(screen.getByRole("button", { name: "Remove item" }));

    expect(removeMock).toHaveBeenCalledWith(["x"]);
  });

  it("updates the quantity from the server's cart", async () => {
    const user = userEvent.setup();
    updateMock.mockResolvedValue({ ok: true, cart: makeCart([{ ...a1, quantity: 3 }, a2, b1]) });
    render(<CartPage initialCart={cart} />);

    await user.click(within(screen.getByRole("region", { name: "Kebun Bali" })).getAllByRole("button", { name: "Increase quantity" })[0]!);

    // The screen changes at once; the request follows after the clicks stop.
    expect(screen.getAllByRole("textbox", { name: "Quantity" })[0]).toHaveValue("3");
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith("a1", 3));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sends one request for a burst of clicks and never blocks the buttons", async () => {
    const user = userEvent.setup();
    updateMock.mockResolvedValue({ ok: true, cart: makeCart([{ ...a1, quantity: 5 }, a2, b1]) });
    render(<CartPage initialCart={cart} />);
    const plus = screen.getAllByRole("button", { name: "Increase quantity" })[0]!;

    await user.click(plus);
    await user.click(plus);
    await user.click(plus);

    expect(plus).toBeEnabled();
    expect(screen.getAllByRole("textbox", { name: "Quantity" })[0]).toHaveValue("5");
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(updateMock).toHaveBeenCalledWith("a1", 5);
  });

  it("sends a waiting quantity change before removing other items, so it is not lost", async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    updateMock.mockImplementation(async () => {
      order.push("update");
      return { ok: true, cart: makeCart([{ ...a1, quantity: 3 }, a2, b1]) };
    });
    removeMock.mockImplementation(async () => {
      order.push("remove");
      return { ok: true, cart: makeCart([{ ...a1, quantity: 3 }, a2]) };
    });
    render(<CartPage initialCart={cart} />);

    await user.click(screen.getAllByRole("button", { name: "Increase quantity" })[0]!);
    await check(user, "Select item Tomato seeds");
    await clickClear(user);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(removeMock).toHaveBeenCalledWith(["b1"]));
    expect(order).toEqual(["update", "remove"]);
    expect(screen.getAllByRole("textbox", { name: "Quantity" })[0]).toHaveValue("3");
  });

  it("rolls back the quantity and shows an error when the update fails", async () => {
    const user = userEvent.setup();
    updateMock.mockResolvedValue({ ok: false, message: "Could not update the quantity. Please try again." });
    render(<CartPage initialCart={cart} />);

    await user.click(screen.getAllByRole("button", { name: "Increase quantity" })[0]!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not update the quantity. Please try again.");
    expect(screen.getAllByRole("textbox", { name: "Quantity" })[0]).toHaveValue("2");
  });

  it("shows the stock message from the backend when the quantity is too high", async () => {
    const user = userEvent.setup();
    updateMock.mockResolvedValue({ ok: false, message: "Only 3 left in stock." });
    render(<CartPage initialCart={cart} />);

    await user.click(screen.getAllByRole("button", { name: "Increase quantity" })[0]!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Only 3 left in stock.");
  });

  it("disables Clear when nothing is selected", () => {
    render(<CartPage initialCart={cart} />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  });

  it("asks for confirmation, then removes the selected items", async () => {
    const user = userEvent.setup();
    removeMock.mockResolvedValue({ ok: true, cart: makeCart([a2, b1]) });
    render(<CartPage initialCart={cart} />);

    await check(user, "Select item Banana");
    await clickClear(user);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Remove 1 selected item from your cart?");
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));

    expect(removeMock).toHaveBeenCalledWith(["a1"]);
    expect(await screen.findByRole("status")).toHaveTextContent("Items removed from cart.");
    expect(screen.queryByText("Banana")).not.toBeInTheDocument();
    expect(screen.getByText("Mango")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not remove anything when the user cancels", async () => {
    const user = userEvent.setup();
    render(<CartPage initialCart={cart} />);

    await check(user, "Select item Banana");
    await clickClear(user);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));

    expect(removeMock).not.toHaveBeenCalled();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("keeps the items and the selection, and shows an error, when removing fails", async () => {
    const user = userEvent.setup();
    removeMock.mockResolvedValue({ ok: false, message: "Could not remove the items. Please try again." });
    render(<CartPage initialCart={cart} />);

    await check(user, "Select item Banana");
    await clickClear(user);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Remove" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not remove the items. Please try again.");
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select item Banana" })).toBeChecked();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the empty state after the last items are removed", async () => {
    const user = userEvent.setup();
    removeMock.mockResolvedValue({ ok: true, cart: makeCart([]) });
    render(<CartPage initialCart={makeCart([a1])} />);

    await check(user, "Select item Banana");
    await clickClear(user);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Remove" }));

    expect(await screen.findByText("Your cart is empty")).toBeInTheDocument();
  });

  it("shows 'Checkout is coming soon.' when Buy is pressed", async () => {
    const user = userEvent.setup();
    buyMock.mockResolvedValue({ ok: false, message: "Checkout is coming soon." });
    render(<CartPage initialCart={cart} />);

    await check(user, "Select item Banana");
    await user.click(screen.getAllByRole("button", { name: "Buy (1)" })[0]!);

    expect(buyMock).toHaveBeenCalledWith(["a1"]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Checkout is coming soon.");
  });

  it("toggles the heart without calling an API", async () => {
    const user = userEvent.setup();
    render(<CartPage initialCart={makeCart([a1])} />);

    const heart = screen.getByRole("button", { name: "Add to wishlist" });
    expect(heart).toHaveAttribute("aria-pressed", "false");
    await user.click(heart);

    expect(screen.getByRole("button", { name: "Remove from wishlist" })).toHaveAttribute("aria-pressed", "true");
    expect(removeMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
