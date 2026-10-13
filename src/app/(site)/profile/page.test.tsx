import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadProfile } from "@/features/profile/data/profile.loader";
import { requireUser } from "@/lib/auth/require-user";
import ProfileRoute from "./page";

vi.mock("server-only", () => ({}));
vi.mock("@/features/profile/components/ProfilePage", () => ({ ProfilePage: () => null }));
vi.mock("@/features/profile/data/profile.loader", () => ({ loadProfile: vi.fn() }));
vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn(),
  // Like the real one, it never returns: it throws.
  redirectToLogin: (path: string) => {
    throw new Error(`REDIRECT:/login?redirect=${encodeURIComponent(path)}`);
  },
}));

const requireUserMock = vi.mocked(requireUser);
const loadMock = vi.mocked(loadProfile);

beforeEach(() => vi.clearAllMocks());

describe("/profile route", () => {
  it("asks for the session of /profile, so a guest (no token, or GET /auth/me answers 401) goes to /login?redirect=/profile", async () => {
    requireUserMock.mockRejectedValue(new Error("REDIRECT:/login?redirect=%2Fprofile"));

    await expect(ProfileRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fprofile");

    expect(requireUserMock).toHaveBeenCalledWith("/profile");
    expect(loadMock).not.toHaveBeenCalled();
  });

  it("sends the user to login when the profile answers 401", async () => {
    requireUserMock.mockResolvedValue({ token: "t", user: { user_id: 1, username: "u", email: "u@x.co" } });
    loadMock.mockResolvedValue({ status: "unauthorized" });

    await expect(ProfileRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fprofile");
  });

  it("loads the profile with the user's token", async () => {
    requireUserMock.mockResolvedValue({ token: "secret", user: { user_id: 1, username: "u", email: "u@x.co" } });
    loadMock.mockResolvedValue({ status: "ok", profile: { user: { username: "u", name: "U", email: "u@x.co", phone: null, photoUrl: null }, address: null } });

    await ProfileRoute();

    expect(loadMock).toHaveBeenCalledWith("secret");
  });
});
