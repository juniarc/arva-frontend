import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getShop, getShopProducts } from "@/features/shops/data/shop.loader";
import { makePublicProducts, makeShop } from "@/features/shops/shop.fixture";
import ShopNotFound from "./not-found";
import ShopRoute from "./page";

vi.mock("server-only", () => ({}));
vi.mock("@/features/shops/components/ShopPage", () => ({ ShopPage: () => null }));
vi.mock("@/features/shops/data/shop.loader", () => ({ getShop: vi.fn(), getShopProducts: vi.fn() }));

const cookieValue = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "token" && cookieValue.token ? { name, value: cookieValue.token } : undefined),
  }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

const getShopMock = vi.mocked(getShop);
const getProductsMock = vi.mocked(getShopProducts);

const route = (slug: string, page?: string) => ShopRoute({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({ page }) });

beforeEach(() => {
  vi.clearAllMocks();
  cookieValue.token = undefined;
  getShopMock.mockResolvedValue({ status: "ok", shop: makeShop() });
  getProductsMock.mockResolvedValue(makePublicProducts());
});

describe("/shops/[slug] route", () => {
  it("is public: a guest gets the page, and the loaders get no token", async () => {
    await route("bali-fresh-farm");

    expect(getShopMock).toHaveBeenCalledWith("bali-fresh-farm", undefined);
    expect(getProductsMock).toHaveBeenCalledWith("bali-fresh-farm", 1, undefined);
  });

  it("forwards the token cookie to the backend when there is one", async () => {
    cookieValue.token = "secret";

    await route("bali-fresh-farm");

    expect(getShopMock).toHaveBeenCalledWith("bali-fresh-farm", "secret");
    expect(getProductsMock).toHaveBeenCalledWith("bali-fresh-farm", 1, "secret");
  });

  it("shows the not-found page for an unknown slug", async () => {
    getShopMock.mockResolvedValue({ status: "not-found" });

    await expect(route("nope")).rejects.toThrow("NOT_FOUND");
  });

  it("lets a failure of the shop load reach the error page", async () => {
    getShopMock.mockRejectedValue(new Error("boom"));

    await expect(route("bali-fresh-farm")).rejects.toThrow("boom");
  });

  it("reads the page number from the URL, and ignores values that are not numbers", async () => {
    await route("bali-fresh-farm", "1");
    expect(getProductsMock).toHaveBeenLastCalledWith("bali-fresh-farm", 1, undefined);

    getProductsMock.mockResolvedValue({ ...makePublicProducts(), pagination: { page: 3, limit: 8, total: 24, totalPages: 3 } });
    await route("bali-fresh-farm", "3");
    expect(getProductsMock).toHaveBeenLastCalledWith("bali-fresh-farm", 3, undefined);

    for (const bad of ["abc", "-1", "1e3", "0x10", ""]) {
      await route("bali-fresh-farm", bad);
      expect(getProductsMock).toHaveBeenLastCalledWith("bali-fresh-farm", 1, undefined);
    }
  });

  it("sends a page past the end to the last page", async () => {
    getProductsMock.mockResolvedValue({ ...makePublicProducts(), pagination: { page: 9, limit: 8, total: 20, totalPages: 3 } });

    await expect(route("bali-fresh-farm", "9")).rejects.toThrow("REDIRECT:/shops/bali-fresh-farm?page=3");
  });

  it("still shows the page when only the products fail", async () => {
    getProductsMock.mockResolvedValue({ status: "error" });

    await expect(route("bali-fresh-farm")).resolves.toBeTruthy();
  });
});

describe("shop not-found page", () => {
  it("says 'Shop not found' with a link to /products", () => {
    render(<ShopNotFound />);

    expect(screen.getByRole("heading", { name: "Shop not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute("href", "/products");
  });
});
