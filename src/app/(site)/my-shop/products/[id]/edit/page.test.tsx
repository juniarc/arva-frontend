import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOwnedProduct } from "@/features/seller-products/data/product.loader";
import { parseOwnedProduct } from "@/features/seller-products/mappers/product-form.mapper";
import { ownedDto } from "@/features/seller-products/product.fixture";
import { getMyShop } from "@/features/shops/data/shop.loader";
import { makeMyShop } from "@/features/shops/shop.fixture";
import { requireUser } from "@/lib/auth/require-user";
import EditProductRoute from "./page";

vi.mock("server-only", () => ({}));
vi.mock("@/features/seller-products/components/EditProductPage", () => ({ EditProductPage: () => null }));
vi.mock("@/features/seller-products/data/product.loader", () => ({ getOwnedProduct: vi.fn() }));
vi.mock("@/features/shops/data/shop.loader", () => ({ getMyShop: vi.fn() }));
vi.mock("@/features/products/api/catalog.server", () => ({ getCategories: vi.fn(async () => []) }));
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
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

const requireUserMock = vi.mocked(requireUser);
const productMock = vi.mocked(getOwnedProduct);
const shopMock = vi.mocked(getMyShop);
const route = (id = "42") => EditProductRoute({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue({ token: "secret", user: { user_id: 1, username: "u", email: "u@x.co" } });
  shopMock.mockResolvedValue({ status: "ok", shop: makeMyShop({ slug: "bali-fresh-farm" }) });
  productMock.mockResolvedValue({ status: "ok", product: parseOwnedProduct(ownedDto()) });
});

describe("/my-shop/products/[id]/edit route", () => {
  it("sends a guest to login with the right redirect", async () => {
    requireUserMock.mockRejectedValue(new Error("REDIRECT:/login?redirect=%2Fmy-shop%2Fproducts%2F42%2Fedit"));
    await expect(route()).rejects.toThrow("REDIRECT:/login?redirect=%2Fmy-shop%2Fproducts%2F42%2Fedit");
    expect(requireUserMock).toHaveBeenCalledWith("/my-shop/products/42/edit");
  });

  it("shows not-found for a missing product, or one that belongs to someone else", async () => {
    productMock.mockResolvedValue({ status: "not-found" });
    await expect(route()).rejects.toThrow("NOT_FOUND");
  });

  it("sends a user without a shop to /my-shop", async () => {
    shopMock.mockResolvedValue({ status: "none" });
    await expect(route()).rejects.toThrow("REDIRECT:/my-shop");
  });

  it("loads the product with the user's token and gives it to the form", async () => {
    const page = await route();
    expect(productMock).toHaveBeenCalledWith("secret", "42");
    expect(isValidElement(page) && (page.props as { shopSlug: string }).shopSlug).toBe("bali-fresh-farm");
  });
});
