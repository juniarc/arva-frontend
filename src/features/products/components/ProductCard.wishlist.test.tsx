import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeProduct } from "@/features/home/components/home.fixture";
import { ProductCard } from "./ProductCard";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const product = makeProduct(1, { name: "Manggo" });

describe("ProductCard, default mode", () => {
  it("is unchanged: the small cart icon button, and no heart or wide button", () => {
    render(<ProductCard product={product} isLoggedIn />);

    expect(screen.getByRole("button", { name: "Add Manggo to cart" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /wishlist/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add To Cart" })).not.toBeInTheDocument();
  });

  it("ignores the wishlist-only props when wishlistState is not set", () => {
    render(<ProductCard product={product} outOfStock showWishlistButton onWishlistClick={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /wishlist/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Manggo to cart" })).toBeEnabled();
  });
});

describe("ProductCard, wishlist mode", () => {
  it("shows a filled, pressed heart and a wide Add To Cart button instead of the cart icon", () => {
    render(<ProductCard product={product} wishlistState="in-wishlist" />);

    expect(screen.getByRole("button", { name: "Remove from wishlist" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Add To Cart" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Add Manggo to cart" })).not.toBeInTheDocument();
  });

  it("calls the handlers", async () => {
    const user = userEvent.setup();
    const onWishlistClick = vi.fn();
    const onAddToCartClick = vi.fn();
    render(
      <ProductCard
        product={product}
        wishlistState="in-wishlist"
        onWishlistClick={onWishlistClick}
        onAddToCartClick={onAddToCartClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove from wishlist" }));
    await user.click(screen.getByRole("button", { name: "Add To Cart" }));

    expect(onWishlistClick).toHaveBeenCalledTimes(1);
    expect(onAddToCartClick).toHaveBeenCalledTimes(1);
  });

  it("disables Add To Cart and says 'Out of stock' when the product is not available", () => {
    render(<ProductCard product={product} wishlistState="in-wishlist" outOfStock />);

    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
  });

  it("shows an empty heart for 'none', and can hide the heart", () => {
    const { rerender } = render(<ProductCard product={product} wishlistState="none" />);
    expect(screen.getByRole("button", { name: "Add to wishlist" })).toHaveAttribute("aria-pressed", "false");

    rerender(<ProductCard product={product} wishlistState="none" showWishlistButton={false} />);
    expect(screen.queryByRole("button", { name: /wishlist/i })).not.toBeInTheDocument();
  });
});
