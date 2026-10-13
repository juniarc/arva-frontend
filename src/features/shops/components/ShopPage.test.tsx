import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeOwnerProducts, makeOwnerShop, makePublicProducts, makeShop, manageDto, productItemDto } from "../shop.fixture";
import type { ShopProductsResult } from "../data/shop.loader";
import { NO_PRODUCTS_MESSAGE, PRODUCTS_UNAVAILABLE_MESSAGE } from "./ShopProducts";
import { ShopPage } from "./ShopPage";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }) }));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

const OWNER_ONLY = ["Edit Shop Info", "Shop Information", "Shop Address", "Shipping Channels", "+ Add New Product"];

function expectNoOwnerControls() {
  expect(screen.queryByRole("link", { name: "Edit Shop Info" })).not.toBeInTheDocument();
  for (const heading of ["Shop Information", "Shop Address", "Shipping Channels"]) {
    expect(screen.queryByRole("heading", { name: heading })).not.toBeInTheDocument();
  }
  expect(screen.queryByText("shop@example.com")).not.toBeInTheDocument();
  expect(screen.queryByText("Jl. Kebon Sirih No. 1")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /add new product/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /edit product/i })).not.toBeInTheDocument();
  expect(OWNER_ONLY.length).toBeGreaterThan(0);
}

describe("ShopPage: the shop", () => {
  it("shows the name, city, rating, operating hours and description", () => {
    render(<ShopPage shop={makeShop()} products={makePublicProducts()} isLoggedIn={false} />);

    expect(screen.getByRole("heading", { level: 1, name: "Bali Fresh Farm" })).toBeInTheDocument();
    // The shop's city, and the same city on the product card.
    expect(screen.getAllByText("Jakarta")).toHaveLength(2);
    expect(screen.getByText("Rated 3.4 out of 5 from 10 ratings.")).toBeInTheDocument();
    expect(screen.getByText("09:00 - 19:00")).toBeInTheDocument();
    expect(screen.getByText("Operating Hours")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Shop Description" })).toBeInTheDocument();
    expect(screen.getByText("Fresh bananas straight from local farmers.")).toBeInTheDocument();
  });

  it("says so when the shop has no ratings", () => {
    render(<ShopPage shop={makeShop({ rating: { average: 0, ratingCount: 0 } })} products={makePublicProducts()} isLoggedIn={false} />);
    expect(screen.getByText("No ratings yet.")).toBeInTheDocument();
  });

  it("uses the first letter when there is no logo", () => {
    render(<ShopPage shop={makeShop()} products={makePublicProducts()} isLoggedIn={false} />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});

describe("ShopPage: who sees what", () => {
  it("a guest sees no owner controls, and the public product cards", () => {
    render(<ShopPage shop={makeShop()} products={makePublicProducts()} isLoggedIn={false} />);

    expectNoOwnerControls();
    expect(screen.getByRole("link", { name: "Banana Fruits from Bali" })).toHaveAttribute("href", "/products/banana-bali");
  });

  it("a logged-in non-owner sees no owner controls either", () => {
    render(<ShopPage shop={makeShop()} products={makePublicProducts()} isLoggedIn />);
    expectNoOwnerControls();
  });

  it("does not show owner details that arrive for a non-owner", () => {
    // A response that carries owner details for someone who is not the owner: the mapper drops them.
    render(<ShopPage shop={makeShop({ ownerDetails: { contact: { email: "shop@example.com", phone: null }, address: null, shippingChannels: [] } })} products={makePublicProducts()} isLoggedIn />);
    expectNoOwnerControls();
  });

  it("the owner sees Edit Shop Info, the owner details and the owner product list", () => {
    render(<ShopPage shop={makeOwnerShop()} products={makeOwnerProducts()} isLoggedIn />);

    expect(screen.getByRole("link", { name: "Edit Shop Info" })).toHaveAttribute("href", "/my-shop/edit");

    const info = screen.getByRole("region", { name: "Shop Information" });
    expect(within(info).getByText("shop@example.com")).toBeInTheDocument();
    expect(within(info).getByText("+6281234567890")).toBeInTheDocument();

    const address = screen.getByRole("region", { name: "Shop Address" });
    for (const text of ["Jl. Kebon Sirih No. 1", "Gelora", "Tanah Abang", "Jakarta Pusat", "DKI Jakarta", "10270"]) {
      expect(within(address).getByText(text)).toBeInTheDocument();
    }

    const channels = screen.getByRole("region", { name: "Shipping Channels" });
    expect(within(channels).getByText("JNE")).toBeInTheDocument();
    expect(within(channels).getByText("J&T")).toBeInTheDocument();

    // The owner's list has rows with the owner's fields, not cards.
    expect(screen.getByText("Blue, 100 ml")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("Rp 1.000")).toBeInTheDocument();
    expect(screen.getByText("Fruit")).toBeInTheDocument();
    expect(screen.getByText("3.4 (10)")).toBeInTheDocument();
  });

  it("the owner's list includes inactive products, marked Inactive", () => {
    const products = makeOwnerProducts([
      productItemDto({ id: "1", slug: "a", name: "Active one", manage: manageDto() }),
      productItemDto({ id: "2", slug: "b", name: "Hidden one", manage: manageDto({ isActive: false }) }),
    ]);
    render(<ShopPage shop={makeOwnerShop()} products={products} isLoggedIn />);

    expect(screen.getByRole("link", { name: "Hidden one" })).toBeInTheDocument();
    expect(screen.getAllByText("Inactive")).toHaveLength(1);
  });

  it("shows the discount of a product when it has one", () => {
    const products = makeOwnerProducts([productItemDto({ originalPrice: 2000, discountPercent: 10, manage: manageDto() })]);
    render(<ShopPage shop={makeOwnerShop()} products={products} isLoggedIn />);
    expect(screen.getByText("10 %")).toBeInTheDocument();
  });
});

describe("ShopPage: the disabled owner actions", () => {
  it("+ Add New Product, Edit Product and delete are disabled, say Coming soon, and call nothing", () => {
    render(<ShopPage shop={makeOwnerShop()} products={makeOwnerProducts()} isLoggedIn />);

    const add = screen.getByRole("button", { name: "Add new product" });
    const edit = screen.getByRole("button", { name: "Edit product Banana Fruits from Bali" });
    const remove = screen.getByRole("button", { name: "Delete Banana Fruits from Bali" });

    for (const button of [add, edit, remove]) {
      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription("Coming soon.");
      expect(button.closest("[title]")).toHaveAttribute("title", "Coming soon.");
      button.click();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("ShopPage: the products section", () => {
  it("shows its own message when the products fail, while the header and description still render", () => {
    const failed: ShopProductsResult = { status: "error" };
    render(<ShopPage shop={makeShop()} products={failed} isLoggedIn={false} />);

    expect(screen.getByText(PRODUCTS_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Bali Fresh Farm" })).toBeInTheDocument();
    expect(screen.getByText("Fresh bananas straight from local farmers.")).toBeInTheDocument();
  });

  it("says the shop has no products yet", () => {
    render(<ShopPage shop={makeShop()} products={makePublicProducts([])} isLoggedIn={false} />);
    expect(screen.getByText(NO_PRODUCTS_MESSAGE)).toBeInTheDocument();
  });

  it("an owner with no products sees the message and the disabled Add New Product button", () => {
    render(<ShopPage shop={makeOwnerShop()} products={makeOwnerProducts([])} isLoggedIn />);

    expect(screen.getByText(NO_PRODUCTS_MESSAGE)).toBeInTheDocument();
    for (const button of screen.getAllByRole("button", { name: "Add new product" })) expect(button).toBeDisabled();
  });

  it("links the pages of the shop, keeping the shop's address", () => {
    const items = Array.from({ length: 8 }, (_, index) => productItemDto({ id: String(index), slug: `p${index}`, name: `Product ${index}` }));
    const products = makePublicProducts(items);
    render(<ShopPage shop={makeShop()} products={{ ...products, pagination: { page: 1, limit: 8, total: 20, totalPages: 3 } }} isLoggedIn={false} />);

    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute("href", "/shops/bali-fresh-farm?page=2");
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/shops/bali-fresh-farm?page=2");
  });
});
