import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadDraft } from "@/features/checkout/data/checkout.loader";
import { requireUser } from "@/lib/auth/require-user";
import CheckoutRoute from "./page";

vi.mock("server-only", () => ({}));
vi.mock("@/features/checkout/components/CheckoutPage", () => ({ CheckoutPage: () => null }));
vi.mock("@/features/checkout/data/checkout.loader", () => ({ loadDraft: vi.fn() }));
vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn(),
  // Like the real ones, these never return: they throw.
  redirectToLogin: (path: string) => {
    throw new Error(`REDIRECT:/login?redirect=${encodeURIComponent(path)}`);
  },
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const requireUserMock = vi.mocked(requireUser);
const loadMock = vi.mocked(loadDraft);
const user = { token: "secret", user: { user_id: 1, username: "u", email: "u@x.co" } };

beforeEach(() => vi.clearAllMocks());

describe("/checkout route", () => {
  it("sends a guest (no token, or a token the backend rejects) to /login?redirect=/checkout", async () => {
    requireUserMock.mockRejectedValue(new Error("REDIRECT:/login?redirect=%2Fcheckout"));

    await expect(CheckoutRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fcheckout");
    expect(loadMock).not.toHaveBeenCalled();
  });

  it("sends the user to login when the draft answers 401", async () => {
    requireUserMock.mockResolvedValue(user);
    loadMock.mockResolvedValue({ status: "unauthorized" });

    await expect(CheckoutRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fcheckout");
  });

  it("sends the user back to the cart, with a notice, when there is no draft", async () => {
    requireUserMock.mockResolvedValue(user);
    loadMock.mockResolvedValue({ status: "missing" });

    await expect(CheckoutRoute()).rejects.toThrow("REDIRECT:/cart?notice=checkout_expired");
  });

  it("loads the draft with the user's token", async () => {
    requireUserMock.mockResolvedValue(user);
    loadMock.mockResolvedValue({ status: "ok", draft: { items: [] } as never });

    await CheckoutRoute();

    expect(loadMock).toHaveBeenCalledWith("secret");
  });
});
