import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { NavbarSession } from "@/lib/navbar/navbar.types";
import { MobileMenu } from "./MobileMenu";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }) }));

const user: NavbarSession = {
  kind: "user",
  user: { username: "agus_01", email: "agus@example.com", photoUrl: null },
  cart: { itemCount: 3, items: [] },
  shop: { status: "shop", slug: "bali-fresh-farm", name: "Bali Fresh Farm", logoUrl: null, city: null, rating: null },
};

const renderMenu = (session: NavbarSession, onClose = vi.fn()) => {
  render(<MobileMenu open onClose={onClose} categories={[]} session={session} />);
  return onClose;
};

describe("MobileMenu", () => {
  it("shows the avatar, username and email at the top, linking to the profile", () => {
    renderMenu(user);

    expect(screen.getByRole("img", { name: "agus_01" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /agus_01/ })).toHaveAttribute("href", "/profile");
    expect(screen.getByText("agus@example.com")).toBeInTheDocument();
  });

  it("has My Shop (the shop's name), Wishlist, Cart with its badge, My Profile, Order History and Logout", () => {
    renderMenu(user);

    expect(screen.getByRole("link", { name: "Bali Fresh Farm" })).toHaveAttribute("href", "/shops/bali-fresh-farm");
    expect(screen.getByRole("link", { name: "Wishlist" })).toHaveAttribute("href", "/wishlist");
    expect(screen.getByRole("link", { name: "Cart , 3 items" })).toHaveAttribute("href", "/cart");
    expect(screen.getByRole("link", { name: "My Profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: "Order History" })).toHaveAttribute("href", "/orders");
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("offers Create Shop to a user without a shop", () => {
    renderMenu({ ...user, shop: { status: "none" } } as NavbarSession);
    expect(screen.getByRole("link", { name: "Create Shop" })).toHaveAttribute("href", "/my-shop/create");
  });

  it("asks a guest to log in, and sends the logged-in-only items to login first", () => {
    renderMenu({ kind: "guest" });

    expect(screen.getByText("Log in to continue")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Order History" })).toHaveAttribute("href", "/login?redirect=%2Forders");
    expect(screen.getByRole("link", { name: "My Shop" })).toHaveAttribute("href", "/login?redirect=%2Fmy-shop");
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
  });

  it("closes on Escape and with the close button", async () => {
    const userEvents = userEvent.setup();
    const onClose = renderMenu(user);

    await userEvents.click(screen.getByRole("button", { name: "Close menu" }));
    expect(onClose).toHaveBeenCalled();

    onClose.mockClear();
    screen.getByRole("dialog", { name: "Navigation menu", hidden: true }).dispatchEvent(new Event("close"));
    expect(onClose).toHaveBeenCalled();
  });
});
