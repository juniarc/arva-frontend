import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOrders } from "@/features/orders/data/orders.loader";
import { parseOrderPage } from "@/features/orders/mappers/order.mapper";
import { orderPageDto } from "@/features/orders/orders.fixture";
import { requireUser } from "@/lib/auth/require-user";
import OrdersRoute from "./page";

vi.mock("server-only", () => ({}));
vi.mock("@/features/orders/components/OrderHistoryPage", () => ({ OrderHistoryPage: () => null }));
vi.mock("@/features/orders/data/orders.loader", () => ({ getOrders: vi.fn() }));
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
const getOrdersMock = vi.mocked(getOrders);
const route = (page?: string) => OrdersRoute({ searchParams: Promise.resolve({ page }) });

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue({ token: "secret", user: { user_id: 1, username: "u", email: "u@x.co" } });
  getOrdersMock.mockResolvedValue({ status: "ok", ...parseOrderPage(orderPageDto()) });
});

describe("/orders route", () => {
  it("sends a guest to /login?redirect=/orders", async () => {
    requireUserMock.mockRejectedValue(new Error("REDIRECT:/login?redirect=%2Forders"));
    await expect(route()).rejects.toThrow("REDIRECT:/login?redirect=%2Forders");
    expect(requireUserMock).toHaveBeenCalledWith("/orders");
  });

  it("loads the orders with the user's token and the page from the URL", async () => {
    await route("1");
    expect(getOrdersMock).toHaveBeenCalledWith("secret", 1);

    await route("abc");
    expect(getOrdersMock).toHaveBeenLastCalledWith("secret", 1);
  });

  it("sends the user to login when the orders answer 401", async () => {
    getOrdersMock.mockResolvedValue({ status: "unauthorized" });
    await expect(route()).rejects.toThrow("REDIRECT:/login?redirect=%2Forders");
  });

  it("sends a page past the end to the last page", async () => {
    await expect(route("5")).rejects.toThrow("REDIRECT:/orders");
  });
});
