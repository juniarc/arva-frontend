import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductDetail } from "./ProductDetail";
import { makePageData, makeProductDetail } from "./product-page.fixture";

const { push, refresh, addToCartMock } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  addToCartMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh, back: vi.fn() }) }));
vi.mock("@/features/cart/api/add-to-cart", () => ({ addToCart: addToCartMock }));

beforeEach(() => {
  push.mockReset();
  refresh.mockReset();
  addToCartMock.mockReset();
  addToCartMock.mockResolvedValue({ ok: true });
});

function renderPage(options: { isLoggedIn?: boolean; data?: ReturnType<typeof makePageData> } = {}) {
  const { isLoggedIn = true, data = makePageData() } = options;
  render(<ProductDetail data={data} isLoggedIn={isLoggedIn} />);
  return { user: userEvent.setup(), panel: screen.getByRole("region", { name: "Purchase options" }) };
}

/** The sticky bar's buttons come last in the page (the desktop panel's come first). */
function barButton(name: string): HTMLElement {
  const buttons = screen.getAllByRole("button", { name });
  return buttons[buttons.length - 1] as HTMLElement;
}

describe("ProductDetail page", () => {
  it("renders one h1 and the sections in the expected order", () => {
    renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bali's Banana Fruit");

    const sections = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(sections).toEqual([
      "Description",
      "Product Reviews",
      "Products from Tani Makmur",
      "Recommendation for you",
    ]);
  });

  it("links the shop's Visit button to its shop page", () => {
    renderPage();

    expect(screen.getByRole("link", { name: /Visit/ })).toHaveAttribute("href", "/shops/tani-makmur");
  });

  it("shows the first variant's price and unit before anything is selected", () => {
    renderPage();

    expect(screen.getAllByText("Rp 1.000")[0]).toBeInTheDocument();
    expect(screen.getByText("/ kg")).toBeInTheDocument();
  });
});

describe("Desktop purchase panel", () => {
  it("shows the total as price times quantity", async () => {
    const { user, panel } = renderPage();

    await user.click(within(panel).getByRole("button", { name: "Increase quantity" }));
    await user.click(within(panel).getByRole("button", { name: "Increase quantity" }));

    expect(within(panel).getByLabelText("Quantity")).toHaveValue("3");
    expect(within(panel).getByText("Rp 3.000")).toBeInTheDocument();
  });

  it("keeps the quantity between 1 and the variant's stock", async () => {
    const { user, panel } = renderPage();
    await user.click(within(panel).getByRole("button", { name: "1 kg" }));
    const increase = within(panel).getByRole("button", { name: "Increase quantity" });
    const decrease = within(panel).getByRole("button", { name: "Decrease quantity" });

    expect(decrease).toBeDisabled();
    await user.click(increase);
    await user.click(increase);
    expect(within(panel).getByLabelText("Quantity")).toHaveValue("3");
    expect(increase).toBeDisabled();
  });

  it("updates the price and the total when the variant changes", async () => {
    const { user, panel } = renderPage();

    await user.click(within(panel).getByRole("button", { name: "1 kg" }));

    expect(within(panel).getByRole("button", { name: "1 kg" })).toHaveAttribute("aria-pressed", "true");
    expect(within(panel).getByText("Rp 2.000")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 2.000").length).toBeGreaterThan(1);
  });

  it("warns when only a few are left, and shows 'Out of stock' for a sold-out variant", async () => {
    const { user, panel } = renderPage();

    await user.click(within(panel).getByRole("button", { name: "1 kg" }));
    expect(within(panel).getByText("Only 3 left")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "2 kg" }));
    expect(within(panel).getByText("Out of stock", { selector: "p" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Out of stock" })).toBeDisabled();
  });

  it("adds the selected variant and quantity to the cart and shows a success message", async () => {
    const { user, panel } = renderPage();
    await user.click(within(panel).getByRole("button", { name: "Increase quantity" }));

    await user.click(within(panel).getByRole("button", { name: "Add To Cart" }));

    await waitFor(() => expect(addToCartMock).toHaveBeenCalledWith({ variantId: "v1", quantity: 2 }));
    expect(await screen.findByRole("status")).toHaveTextContent("Product added to cart.");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the Buy Now stub message", async () => {
    const { user, panel } = renderPage();

    await user.click(within(panel).getByRole("button", { name: "Buy Now" }));

    expect(await within(panel).findByRole("alert")).toHaveTextContent("Checkout is coming soon.");
    expect(push).not.toHaveBeenCalled();
  });
});

describe("Mobile and tablet action bar", () => {
  it("opens the modal from Add To Cart and closes it with Escape", async () => {
    const { user } = renderPage();

    await user.click(barButton("Add To Cart"));
    const dialog = screen.getByRole("dialog", { name: "Bali's Banana Fruit" });
    expect(within(dialog).getByRole("button", { name: "Add To Chart" })).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the modal in buy-now mode and shows the stub message", async () => {
    const { user } = renderPage();

    await user.click(barButton("Buy Now"));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Buy Now" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Checkout is coming soon.");
    expect(addToCartMock).not.toHaveBeenCalled();
  });

  it("disables both buttons and says 'Out of stock' when every variant is sold out", () => {
    const soldOut = makeProductDetail({ variants: [{ id: "v1", label: "5 L", price: 22000, stock: 0, unit: "pcs" }] });
    renderPage({ data: makePageData(soldOut) });

    expect(barButton("Out of stock")).toBeDisabled();
    expect(barButton("Buy Now")).toBeDisabled();
  });
});

describe("Guests", () => {
  it("are sent to the login page from the wishlist heart", async () => {
    const { user } = renderPage({ isLoggedIn: false });

    await user.click(screen.getAllByRole("button", { name: "Add to wishlist" })[0] as HTMLElement);

    expect(push).toHaveBeenCalledWith("/login?redirect=%2F");
  });

  it("are sent to the login page from Add To Cart and Buy Now", async () => {
    const { user } = renderPage({ isLoggedIn: false });

    await user.click(barButton("Add To Cart"));
    await user.click(barButton("Buy Now"));

    expect(push).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("logged-in users can fill the heart", async () => {
    const { user } = renderPage();

    await user.click(screen.getAllByRole("button", { name: "Add to wishlist" })[0] as HTMLElement);

    expect(screen.getAllByRole("button", { name: "Remove from wishlist" })[0]).toHaveAttribute("aria-pressed", "true");
  });
});
