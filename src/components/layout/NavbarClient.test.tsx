import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NavbarCart, NavbarSession, NavbarShop } from "@/lib/navbar/navbar.types";
import { CART_UNAVAILABLE } from "./CartDropdown";
import { NO_SHOP_TEXT } from "./MyShopDropdown";
import { NavbarClient } from "./NavbarClient";

const { replace, refresh } = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh, push: vi.fn() }), usePathname: () => "/" }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

const item = (index: number) => ({ id: String(index), name: `Banana ${index}`, imageUrl: "/b.jpg", variantLabel: "1 kg", unitPrice: 1000, quantity: 2 });
const cartOf = (count: number): NavbarCart => ({ itemCount: count * 2, items: Array.from({ length: count }, (_, index) => item(index + 1)) });
const shop: NavbarShop = { status: "shop", slug: "bali-fresh-farm", name: "Bali Fresh Farm Organic", logoUrl: null, city: "Jakarta", rating: { average: 3.4, ratingCount: 10000 } };

const userSession = (overrides: Partial<Extract<NavbarSession, { kind: "user" }>> = {}): NavbarSession => ({
  kind: "user",
  user: { username: "agus_01", email: "agus@example.com", photoUrl: null },
  cart: cartOf(2),
  shop: { status: "none" },
  ...overrides,
});

function renderNavbar(session: NavbarSession) {
  const user = userEvent.setup();
  render(
    <>
      <NavbarClient session={session} />
      <p>Outside</p>
    </>,
  );
  return user;
}

const cartButton = () => screen.getByRole("button", { name: /^Cart/ });
const panel = (name: string) => screen.queryByRole("region", { name });

describe("NavbarClient: dropdowns", () => {
  it("Cart opens on click and closes on a second click", async () => {
    const user = renderNavbar(userSession());

    await user.click(cartButton());
    expect(panel("Cart preview")).toBeVisible();
    expect(cartButton()).toHaveAttribute("aria-expanded", "true");
    expect(cartButton()).toHaveAttribute("aria-controls", "navbar-cart-panel");

    await user.click(cartButton());
    expect(panel("Cart preview")).toBeNull();
  });

  it("opening another dropdown closes the first one", async () => {
    const user = renderNavbar(userSession());

    await user.click(cartButton());
    await user.click(screen.getByRole("button", { name: "Account menu, agus_01" }));

    expect(panel("Cart preview")).toBeNull();
    expect(panel("Account menu")).toBeVisible();
  });

  it("Escape closes the open dropdown and puts the focus back on its trigger", async () => {
    const user = renderNavbar(userSession());
    await user.click(cartButton());

    await user.keyboard("{Escape}");

    expect(panel("Cart preview")).toBeNull();
    expect(cartButton()).toHaveFocus();
  });

  it("a click outside closes it", async () => {
    const user = renderNavbar(userSession());
    await user.click(cartButton());

    await user.click(screen.getByText("Outside"));

    expect(panel("Cart preview")).toBeNull();
  });
});

describe("NavbarClient: cart", () => {
  it("shows the badge in the button's name, and hides it at 0", () => {
    renderNavbar(userSession({ cart: cartOf(2) }));
    expect(screen.getByRole("button", { name: "Cart, 4 items" })).toBeInTheDocument();
  });

  it("previews at most 3 items, with the line price, and 'See all' only above 3", async () => {
    const user = renderNavbar(userSession({ cart: cartOf(5) }));
    await user.click(cartButton());

    expect(screen.getByText("Banana 3")).toBeInTheDocument();
    expect(screen.queryByText("Banana 4")).not.toBeInTheDocument();
    expect(screen.getAllByText("2 x Rp 1.000")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "See all (10)" })).toHaveAttribute("href", "/cart");
  });

  it("has no 'See all' with 3 items or fewer, and says when the cart is empty", async () => {
    const user = renderNavbar(userSession({ cart: cartOf(3) }));
    await user.click(cartButton());
    expect(screen.queryByRole("link", { name: /See all/ })).not.toBeInTheDocument();
  });

  it("says the cart is empty, with a way to shop", async () => {
    const user = renderNavbar(userSession({ cart: { itemCount: 0, items: [] } }));
    await user.click(screen.getByRole("button", { name: "Cart" }));
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start shopping" })).toHaveAttribute("href", "/products");
  });

  it("keeps the trigger when the cart could not be loaded, and says so", async () => {
    const user = renderNavbar(userSession({ cart: null }));
    await user.click(screen.getByRole("button", { name: "Cart" }));
    expect(screen.getByText(CART_UNAVAILABLE)).toBeInTheDocument();
  });
});

describe("NavbarClient: My Shop", () => {
  it("with no shop, the dropdown offers Create Shop", async () => {
    const user = renderNavbar(userSession({ shop: { status: "none" } }));

    await user.click(screen.getByRole("button", { name: "My Shop" }));

    expect(screen.getByText(NO_SHOP_TEXT)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Shop" })).toHaveAttribute("href", "/my-shop/create");
  });

  it("with a shop, the trigger shows the (shortened) name and the dropdown the shop card", async () => {
    const user = renderNavbar(userSession({ shop }));

    await user.click(screen.getByRole("button", { name: "My shop: Bali Fresh Far…" }));

    const card = panel("My shop");
    expect(card).toHaveTextContent("Bali Fresh Farm Organic");
    expect(card).toHaveTextContent("Jakarta");
    expect(card).toHaveTextContent("3.4 (10.000)");
    expect(screen.getByRole("link", { name: "Visit Bali Fresh Farm Organic" })).toHaveAttribute("href", "/shops/bali-fresh-farm");
  });

  it("when the shop could not be loaded, the default trigger is a link without a preview", () => {
    renderNavbar(userSession({ shop: null }));
    expect(screen.getByRole("link", { name: "My Shop" })).toHaveAttribute("href", "/my-shop");
  });
});

describe("NavbarClient: profile", () => {
  it("shows the avatar and username; the default avatar when there is no photo", () => {
    renderNavbar(userSession());
    const trigger = screen.getByRole("button", { name: "Account menu, agus_01" });
    expect(trigger).toHaveTextContent("agus_01");
    expect(screen.getByRole("img", { name: "agus_01" })).toBeInTheDocument();
  });

  it("shows the photo when there is one", () => {
    renderNavbar(userSession({ user: { username: "agus_01", email: null, photoUrl: "https://cdn.test/me.jpg" } }));
    expect(screen.getAllByRole("img", { name: "agus_01" })[0]).toHaveAttribute("src", "https://cdn.test/me.jpg");
  });

  it("the menu has the email, My Profile, Order History and Logout, which calls the logout route", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const user = renderNavbar(userSession());
    await user.click(screen.getByRole("button", { name: "Account menu, agus_01" }));

    expect(screen.getByText("agus@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: "Order History" })).toHaveAttribute("href", "/orders");

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("leaves the email row out when the email is unknown", async () => {
    const user = renderNavbar(userSession({ user: { username: "agus_01", email: null, photoUrl: null } }));
    await user.click(screen.getByRole("button", { name: "Account menu, agus_01" }));
    expect(screen.queryByText("agus@example.com")).not.toBeInTheDocument();
  });
});

describe("NavbarClient: guest", () => {
  it("Cart and My Shop send a guest to log in with the page to come back to; the profile spot says Login", () => {
    renderNavbar({ kind: "guest" });

    expect(screen.getByRole("link", { name: "Cart" })).toHaveAttribute("href", "/login?redirect=%2Fcart");
    expect(screen.getByRole("link", { name: "My Shop" })).toHaveAttribute("href", "/login?redirect=%2Fmy-shop");
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: /My Profile/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
