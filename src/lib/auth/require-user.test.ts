import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireUser } from "./require-user";

vi.mock("server-only", () => ({}));

const cookieValue = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "token" && cookieValue.token ? { name, value: cookieValue.token } : undefined),
  }),
}));

// Like the real one, redirect() never returns: it throws.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ API_BASE_URL: "http://backend.test/api" }) }));
vi.mock("@/lib/logger", () => ({ logServerError: vi.fn() }));

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  cookieValue.token = undefined;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("requireUser", () => {
  it("redirects a guest to the login page without calling the backend", async () => {
    await expect(requireUser("/cart")).rejects.toThrow("REDIRECT:/login?redirect=%2Fcart");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirects when the backend says the token is no longer valid (401)", async () => {
    cookieValue.token = "expired";
    respond(401, { message: "Please log in." });

    await expect(requireUser("/cart")).rejects.toThrow("REDIRECT:/login?redirect=%2Fcart");
  });

  it("returns the token and the user when the session is valid", async () => {
    cookieValue.token = "good";
    respond(200, { user: { user_id: 1, username: "farmer1", email: "f@example.com" } });

    const result = await requireUser("/cart");

    expect(result.token).toBe("good");
    expect(result.user.username).toBe("farmer1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend.test/api/auth/me");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer good");
  });

  it("throws (error page) when the backend is down, instead of redirecting", async () => {
    cookieValue.token = "good";
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(requireUser("/cart")).rejects.toThrow("Could not verify your session.");
  });
});
