import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { removeFromWishlist } from "../api/wishlist.client";
import { makeWishlist, makeWishlistItem } from "../wishlist.fixture";
import { WishlistPage } from "./WishlistPage";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), refresh }),
}));
vi.mock("../api/wishlist.client", () => ({
  removeFromWishlist: vi.fn(),
  REMOVE_FAILED_MESSAGE: "Wishlist Failed Removed. Please Try Again.",
}));
// The real modal loads variants from the API; here we only check that it opens for the right product.
vi.mock("@/features/products/components/AddToCartModal", () => ({
  AddToCartModal: ({ product, onAdded, onClose }: { product: { name: string }; onAdded: () => void; onClose: () => void }) => (
    <div role="dialog" aria-label={`Add ${product.name}`}>
      <button onClick={onAdded}>Pretend add</button>
      <button onClick={onClose}>Close modal</button>
    </div>
  ),
}));

const removeMock = vi.mocked(removeFromWishlist);

const items = [makeWishlistItem(1), makeWishlistItem(2), makeWishlistItem(3, { isAvailable: false })];
const wishlist = makeWishlist(items);

type User = ReturnType<typeof userEvent.setup>;
const hearts = () => screen.getAllByRole("button", { name: "Remove from wishlist" });
const names = () => screen.queryAllByRole("link").map((link) => link.textContent);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("WishlistPage", () => {
  it("shows one h1 and a card for every item, in order", () => {
    render(<WishlistPage initialWishlist={wishlist} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Wishlist Products" })).toBeInTheDocument();
    expect(names().filter((name) => name?.startsWith("Product"))).toEqual(["Product 1", "Product 2", "Product 3"]);
    expect(hearts()).toHaveLength(3);
  });

  it("shows the empty state with a Start shopping link, and no grid", () => {
    render(<WishlistPage initialWishlist={makeWishlist([])} />);

    expect(screen.getByText("Your wishlist is empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start shopping" })).toHaveAttribute("href", "/products");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("disables Add To Cart for an unavailable product", () => {
    render(<WishlistPage initialWishlist={wishlist} />);

    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Add To Cart" })).toHaveLength(2);
  });

  it("opens the add-to-cart modal for that product, and keeps the item in the wishlist after adding", async () => {
    const user = userEvent.setup();
    render(<WishlistPage initialWishlist={wishlist} />);

    await user.click(screen.getAllByRole("button", { name: "Add To Cart" })[1]!);
    expect(screen.getByRole("dialog", { name: "Add Product 2" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pretend add" }));

    expect(await screen.findByText("Product added to cart.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    expect(removeMock).not.toHaveBeenCalled();
    expect(hearts()).toHaveLength(3);
  });
});

describe("removing an item", () => {
  const open = async (user: User, index = 0) => user.click(hearts()[index]!);

  it("asks first: the heart opens the dialog, and nothing is removed yet", async () => {
    const user = userEvent.setup();
    render(<WishlistPage initialWishlist={wishlist} />);

    await open(user);

    expect(screen.getByRole("alertdialog", { name: "Remove 1 item from Wishlist ?" })).toBeInTheDocument();
    expect(removeMock).not.toHaveBeenCalled();
    expect(hearts()).toHaveLength(3);
  });

  it("Cancel closes the dialog and puts the focus back on the heart", async () => {
    const user = userEvent.setup();
    render(<WishlistPage initialWishlist={wishlist} />);
    const heart = hearts()[0]!;

    await user.click(heart);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(heart).toHaveFocus();
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("Escape closes the dialog when it is not loading", async () => {
    const user = userEvent.setup();
    render(<WishlistPage initialWishlist={wishlist} />);

    await open(user);
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(hearts()).toHaveLength(3);
  });

  it("Delete shows the spinner, removes the card at once, then shows the success message", async () => {
    const user = userEvent.setup();
    let finish: (value: Awaited<ReturnType<typeof removeFromWishlist>>) => void = () => {};
    removeMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<WishlistPage initialWishlist={wishlist} />);

    await open(user, 1);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    // Waiting for the server: spinner, no buttons, and the card is already gone.
    expect(removeMock).toHaveBeenCalledWith(["2"]);
    expect(screen.getByRole("img", { name: "Removing item" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.queryByText("Product 2")).not.toBeInTheDocument();

    await act(async () => finish({ ok: true, wishlist: makeWishlist([items[0]!, items[2]!]) }));

    expect(await screen.findByRole("status")).toHaveTextContent("Wishlist Successfully Removed.");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(hearts()).toHaveLength(2);
  });

  it("restores the card in the same place and shows the error when removing fails", async () => {
    const user = userEvent.setup();
    removeMock.mockResolvedValue({ ok: false, message: "Wishlist Failed Removed. Please Try Again." });
    render(<WishlistPage initialWishlist={wishlist} />);

    await open(user, 1);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Wishlist Failed Removed. Please Try Again.");
    expect(names().filter((name) => name?.startsWith("Product"))).toEqual(["Product 1", "Product 2", "Product 3"]);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("shows the empty state after the last item is removed", async () => {
    const user = userEvent.setup();
    removeMock.mockResolvedValue({ ok: true, wishlist: makeWishlist([]) });
    render(<WishlistPage initialWishlist={makeWishlist([items[0]!])} />);

    await open(user);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Your wishlist is empty")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Wishlist Successfully Removed.");
  });

  it("can close the message with its button", async () => {
    const user = userEvent.setup();
    removeMock.mockResolvedValue({ ok: false, message: "Wishlist Failed Removed. Please Try Again." });
    render(<WishlistPage initialWishlist={wishlist} />);

    await open(user);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const alert = await screen.findByRole("alert");
    await user.click(within(alert).getByRole("button", { name: "Dismiss message" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("the success message", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("hides itself after 4 seconds", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    removeMock.mockResolvedValue({ ok: true, wishlist: makeWishlist([items[0]!, items[2]!]) });
    render(<WishlistPage initialWishlist={wishlist} />);

    await user.click(hearts()[1]!);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByRole("status")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3900);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
