import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadWishlist } from "@/features/wishlist/data/wishlist.loader";
import { requireUser } from "@/lib/auth/require-user";
import WishlistRoute from "./page";

vi.mock("server-only", () => ({}));
vi.mock("@/features/wishlist/components/WishlistPage", () => ({ WishlistPage: () => null }));
vi.mock("@/features/wishlist/data/wishlist.loader", () => ({ loadWishlist: vi.fn() }));
vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn(),
  // Like the real one, it never returns: it throws.
  redirectToLogin: (path: string) => {
    throw new Error(`REDIRECT:/login?redirect=${encodeURIComponent(path)}`);
  },
}));

const requireUserMock = vi.mocked(requireUser);
const loadMock = vi.mocked(loadWishlist);

beforeEach(() => vi.clearAllMocks());

describe("/wishlist route", () => {
  it("sends a guest to /login?redirect=/wishlist without loading anything", async () => {
    requireUserMock.mockRejectedValue(new Error("REDIRECT:/login?redirect=%2Fwishlist"));

    await expect(WishlistRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fwishlist");
    expect(loadMock).not.toHaveBeenCalled();
  });

  it("sends the user to login when the wishlist answers 401", async () => {
    requireUserMock.mockResolvedValue({ token: "t", user: { user_id: 1, username: "u", email: "u@x.co" } });
    loadMock.mockResolvedValue({ status: "unauthorized" });

    await expect(WishlistRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fwishlist");
  });

  it("loads the wishlist with the user's token", async () => {
    requireUserMock.mockResolvedValue({ token: "secret", user: { user_id: 1, username: "u", email: "u@x.co" } });
    loadMock.mockResolvedValue({ status: "ok", wishlist: { items: [], itemCount: 0 } });

    await WishlistRoute();

    expect(loadMock).toHaveBeenCalledWith("secret");
  });
});
