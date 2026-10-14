import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCategories } from "@/features/products/api/catalog.server";
import { getMyShop } from "@/features/shops/data/shop.loader";
import { makeMyShop } from "@/features/shops/shop.fixture";
import { requireUser } from "@/lib/auth/require-user";
import NewProductRoute from "./page";

vi.mock("server-only", () => ({}));
vi.mock("@/features/seller-products/components/NewProductPage", () => ({ NewProductPage: () => null }));
vi.mock("@/features/shops/data/shop.loader", () => ({ getMyShop: vi.fn() }));
vi.mock("@/features/products/api/catalog.server", () => ({ getCategories: vi.fn() }));
vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn(),
  redirectToLogin: (path: string) => {
    throw new Error(`REDIRECT:/login?redirect=${encodeURIComponent(path)}`);
  },
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

const requireUserMock = vi.mocked(requireUser);
const getMyShopMock = vi.mocked(getMyShop);
const categories = [{ id: "1", slug: "seeds", name: "Seeds", iconKey: "seeds" }];

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue({ token: "secret", user: { user_id: 1, username: "u", email: "u@x.co" } });
  vi.mocked(getCategories).mockResolvedValue(categories);
});

describe("/my-shop/products/new route", () => {
  it("sends a guest to /login?redirect=/my-shop/products/new", async () => {
    requireUserMock.mockRejectedValue(new Error("REDIRECT:/login?redirect=%2Fmy-shop%2Fproducts%2Fnew"));

    await expect(NewProductRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fmy-shop%2Fproducts%2Fnew");
    expect(requireUserMock).toHaveBeenCalledWith("/my-shop/products/new");
  });

  it("sends a user without a shop to /my-shop", async () => {
    getMyShopMock.mockResolvedValue({ status: "none" });

    await expect(NewProductRoute()).rejects.toThrow("REDIRECT:/my-shop");
  });

  it("gives the form the owner's shop and the categories", async () => {
    getMyShopMock.mockResolvedValue({ status: "ok", shop: makeMyShop({ slug: "bali-fresh-farm" }) });

    const page = await NewProductRoute();

    expect(getMyShopMock).toHaveBeenCalledWith("secret");
    expect(isValidElement(page) && page.props).toEqual({ shopSlug: "bali-fresh-farm", categories });
  });
});
