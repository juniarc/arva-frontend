import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "../types";
import { ProductCard } from "./ProductCard";

const { push, addToCartMock } = vi.hoisted(() => ({ push: vi.fn(), addToCartMock: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/features/cart/api/add-to-cart", () => ({ addToCart: addToCartMock }));

const product: Product = {
  id: "p1",
  slug: "balis-banana-fruit",
  name: "Bali's Banana Fruit",
  categorySlug: "fruits",
  categoryName: "Fruits",
  price: 1000,
  rating: 3.4,
  soldCount: 501,
  city: "Kab. Bandung",
  imageUrl: "/images/dummy/balis-banana-fruit.jpg",
  shopName: "Kebun Bali",
  variants: [
    { id: "v1", label: "500 ml", price: 1000, stock: 3, unit: "kg" },
    { id: "v2", label: "1000 ml", price: 2000, stock: 250, unit: "kg" },
    { id: "v3", label: "2000 ml", price: 3800, stock: 0, unit: "kg" },
  ],
};

async function openModal() {
  const user = userEvent.setup();
  render(<ProductCard product={product} isLoggedIn />);
  const trigger = screen.getByRole("button", { name: "Add Bali's Banana Fruit to cart" });
  await user.click(trigger);
  return { user, trigger };
}

beforeEach(() => {
  push.mockReset();
  addToCartMock.mockReset();
  addToCartMock.mockResolvedValue({ ok: true });
});

describe("AddToCartModal", () => {
  it("opens with the product name when the card button is clicked", async () => {
    await openModal();

    const dialog = screen.getByRole("dialog", { name: "Bali's Banana Fruit" });
    expect(dialog).toHaveTextContent("Stock : 3 kg");
    expect(dialog).toHaveTextContent("Rp 1.000");
  });

  it("sends guests to the login page with the current page as redirect", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product} isLoggedIn={false} />);

    await user.click(screen.getByRole("button", { name: "Add Bali's Banana Fruit to cart" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/login?redirect=%2F");
  });

  it("updates the price, stock and total when the variant changes", async () => {
    const { user } = await openModal();

    await user.click(screen.getByRole("button", { name: "1000 ml" }));

    const dialog = screen.getByRole("dialog");
    expect(screen.getByRole("button", { name: "1000 ml" })).toHaveAttribute("aria-pressed", "true");
    expect(dialog).toHaveTextContent("Rp 2.000 / kg");
    expect(dialog).toHaveTextContent("Stock : 250 kg");
    expect(dialog).toHaveTextContent("TotalRp 2.000");
  });

  it("keeps the quantity between 1 and the variant's stock, and the total equals price times quantity", async () => {
    const { user } = await openModal();
    const decrease = screen.getByRole("button", { name: "Decrease quantity" });
    const increase = screen.getByRole("button", { name: "Increase quantity" });
    const quantity = screen.getByLabelText("Quantity");

    expect(decrease).toBeDisabled();

    await user.click(increase);
    await user.click(increase);
    await user.click(increase);
    expect(quantity).toHaveValue("3");
    expect(increase).toBeDisabled();
    expect(screen.getByRole("dialog")).toHaveTextContent("TotalRp 3.000");

    await user.click(decrease);
    expect(quantity).toHaveValue("2");
  });

  it("lowers the quantity when the new variant has less stock", async () => {
    const { user } = await openModal();

    await user.click(screen.getByRole("button", { name: "1000 ml" }));
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(screen.getByLabelText("Quantity")).toHaveValue("5");

    await user.click(screen.getByRole("button", { name: "500 ml" }));
    expect(screen.getByLabelText("Quantity")).toHaveValue("3");
  });

  it("closes on Escape and returns focus to the trigger button", async () => {
    const { trigger } = await openModal();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes with the X button", async () => {
    const { user } = await openModal();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes and shows a success message when adding works", async () => {
    const { user } = await openModal();

    await user.click(screen.getByRole("button", { name: "Add To Chart" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(addToCartMock).toHaveBeenCalledWith({ productId: "p1", variantId: "v1", quantity: 1 });
    expect(screen.getByRole("status")).toHaveTextContent("Product added to cart.");
  });

  it("stays open and shows an error message when adding fails", async () => {
    addToCartMock.mockResolvedValue({ ok: false, message: "Could not add to cart. Please try again." });
    const { user } = await openModal();

    await user.click(screen.getByRole("button", { name: "Add To Chart" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not add to cart. Please try again.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add To Chart" })).toBeEnabled();
  });

  it("disables the button and shows 'Out of stock' for a sold-out variant", async () => {
    const { user } = await openModal();

    await user.click(screen.getByRole("button", { name: "2000 ml" }));

    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add To Chart" })).toBeDisabled();
  });

  it("shows 'Out of stock' for a product with no stock at all", async () => {
    const user = userEvent.setup();
    const soldOut: Product = {
      ...product,
      variants: [{ id: "v1", label: "5 L", price: 22000, stock: 0, unit: "pcs" }],
    };
    render(<ProductCard product={soldOut} isLoggedIn />);

    await user.click(screen.getByRole("button", { name: "Add Bali's Banana Fruit to cart" }));

    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add To Chart" })).toBeDisabled();
  });
});
