import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyShopState } from "@/features/shops/components/EmptyShopState";
import { getMyShop, getShippingChannels } from "@/features/shops/data/shop.loader";
import { makeMyShop } from "@/features/shops/shop.fixture";
import { requireUser } from "@/lib/auth/require-user";
import MyShopRoute from "./page";
import CreateShopRoute from "./create/page";
import EditShopRoute from "./edit/page";

vi.mock("server-only", () => ({}));
vi.mock("@/features/shops/components/EmptyShopState", () => ({ EmptyShopState: () => null }));
vi.mock("@/features/shops/components/ShopEditForm", () => ({ ShopEditForm: () => null }));
vi.mock("@/features/shops/components/CreateShopWizard", () => ({ CreateShopWizard: () => null }));
vi.mock("@/features/products/components/BackButton", () => ({ BackButton: () => null }));
vi.mock("@/features/shops/data/shop.loader", () => ({ getMyShop: vi.fn(), getShippingChannels: vi.fn() }));
vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn(),
  // Like the real one, it never returns: it throws.
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
const channelsMock = vi.mocked(getShippingChannels);

const session = { token: "secret", user: { user_id: 1, username: "u", email: "u@x.co" } };

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue(session);
  channelsMock.mockResolvedValue([{ id: "1", name: "JNE" }]);
});

describe("/my-shop route", () => {
  it("sends a guest to /login?redirect=/my-shop without loading anything", async () => {
    requireUserMock.mockRejectedValue(new Error("REDIRECT:/login?redirect=%2Fmy-shop"));

    await expect(MyShopRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fmy-shop");

    expect(requireUserMock).toHaveBeenCalledWith("/my-shop");
    expect(getMyShopMock).not.toHaveBeenCalled();
  });

  it("sends the owner to their shop", async () => {
    getMyShopMock.mockResolvedValue({ status: "ok", shop: makeMyShop({ slug: "bali-fresh-farm" }) });

    await expect(MyShopRoute()).rejects.toThrow("REDIRECT:/shops/bali-fresh-farm");
    expect(getMyShopMock).toHaveBeenCalledWith("secret");
  });

  it("shows the empty state when the user has no shop", async () => {
    getMyShopMock.mockResolvedValue({ status: "none" });

    const page = await MyShopRoute();

    expect(isValidElement(page) && page.type).toBe(EmptyShopState);
  });

  it("sends the user to login when the shop answers 401", async () => {
    getMyShopMock.mockResolvedValue({ status: "unauthorized" });

    await expect(MyShopRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fmy-shop");
  });

  it("lets any other failure reach the error page", async () => {
    getMyShopMock.mockRejectedValue(new Error("boom"));

    await expect(MyShopRoute()).rejects.toThrow("boom");
  });
});

describe("/my-shop/edit route", () => {
  it("sends a guest to /login?redirect=/my-shop/edit without loading anything", async () => {
    requireUserMock.mockRejectedValue(new Error("REDIRECT:/login?redirect=%2Fmy-shop%2Fedit"));

    await expect(EditShopRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fmy-shop%2Fedit");

    expect(requireUserMock).toHaveBeenCalledWith("/my-shop/edit");
    expect(getMyShopMock).not.toHaveBeenCalled();
  });

  it("sends a user without a shop to /my-shop", async () => {
    getMyShopMock.mockResolvedValue({ status: "none" });

    await expect(EditShopRoute()).rejects.toThrow("REDIRECT:/my-shop");
  });

  it("sends the user to login when the shop answers 401", async () => {
    getMyShopMock.mockResolvedValue({ status: "unauthorized" });

    await expect(EditShopRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fmy-shop%2Fedit");
  });

  it("loads the shop with the user's token and gives it, and the channels, to the form", async () => {
    const shop = makeMyShop();
    getMyShopMock.mockResolvedValue({ status: "ok", shop });

    const page = await EditShopRoute();

    expect(getMyShopMock).toHaveBeenCalledWith("secret");
    expect(JSON.stringify(page)).toContain("Edit Shop Information");
    expect(isValidElement(page)).toBe(true);
  });

  it("lets any other failure reach the error page", async () => {
    getMyShopMock.mockRejectedValue(new Error("boom"));

    await expect(EditShopRoute()).rejects.toThrow("boom");
  });
});

describe("/my-shop/create route", () => {
  it("sends a guest to /login?redirect=/my-shop/create without loading anything", async () => {
    requireUserMock.mockRejectedValue(new Error("REDIRECT:/login?redirect=%2Fmy-shop%2Fcreate"));

    await expect(CreateShopRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fmy-shop%2Fcreate");

    expect(requireUserMock).toHaveBeenCalledWith("/my-shop/create");
    expect(getMyShopMock).not.toHaveBeenCalled();
  });

  it("sends a user who already has a shop to it (one shop per user)", async () => {
    getMyShopMock.mockResolvedValue({ status: "ok", shop: makeMyShop({ slug: "bali-fresh-farm" }) });

    await expect(CreateShopRoute()).rejects.toThrow("REDIRECT:/shops/bali-fresh-farm");
  });

  it("shows the wizard for a user without a shop", async () => {
    getMyShopMock.mockResolvedValue({ status: "none" });

    const page = await CreateShopRoute();

    expect(isValidElement(page)).toBe(true);
  });

  it("lets a failed shop check reach the error page", async () => {
    getMyShopMock.mockRejectedValue(new Error("boom"));

    await expect(CreateShopRoute()).rejects.toThrow("boom");
  });
});
