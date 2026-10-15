import { beforeEach, describe, expect, it, vi } from "vitest";
import { profileDto } from "@/features/profile/profile.fixture";
import { myShopDto, shopDto } from "@/features/shops/shop.fixture";
import { loadNavbarSession } from "./session.loader";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ API_BASE_URL: "http://backend.test/api" }) }));
vi.mock("@/lib/logger", () => ({ logServerError: vi.fn() }));

const cookieValue = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "token" && cookieValue.token ? { name, value: cookieValue.token } : undefined),
  }),
}));

type Answer = { status: number; body: unknown } | "network";
const answers = new Map<string, Answer>();
const json = (status: number, body: unknown): Answer => ({ status, body });

const cart = {
  items: [{ id: 1, quantity: 2, product: { id: 9, slug: "b", name: "Banana", imageUrl: "/b.jpg", shop: { slug: "s", name: "S" } }, variant: { id: 5, label: "1 kg", unit: "kg", price: 1000, stock: 4 } }],
  itemCount: 2,
  subtotal: 2000,
};

function happyPath() {
  answers.set("/auth/me", json(200, { user: { user_id: 1, username: "agus_me", email: "me@x.co" } }));
  answers.set("/profile", json(200, profileDto()));
  answers.set("/cart", json(200, cart));
  answers.set("/shops/me", json(200, { shop: myShopDto() }));
  answers.set("/shops/bali-fresh-farm", json(200, { shop: shopDto() }));
}

beforeEach(() => {
  cookieValue.token = "tok";
  answers.clear();
  happyPath();
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    const answer = answers.get(url.replace("http://backend.test/api", "")) ?? json(404, {});
    if (answer === "network") throw new TypeError("fetch failed");
    return new Response(JSON.stringify(answer.body), { status: answer.status });
  });
});

describe("loadNavbarSession", () => {
  it("is a guest without a token, and calls nothing", async () => {
    cookieValue.token = undefined;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    expect(await loadNavbarSession()).toEqual({ kind: "guest" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("is a guest when /auth/me answers 401", async () => {
    answers.set("/auth/me", json(401, { message: "Please log in." }));
    expect(await loadNavbarSession()).toEqual({ kind: "guest" });
  });

  it("loads the user, the cart and the shop", async () => {
    const session = await loadNavbarSession();

    expect(session).toEqual({
      kind: "user",
      user: { username: "agus_01", email: "agus@example.com", photoUrl: null },
      cart: { itemCount: 2, items: [expect.objectContaining({ name: "Banana", unitPrice: 1000 })] },
      shop: expect.objectContaining({ status: "shop", slug: "bali-fresh-farm", city: "Jakarta", rating: { average: 3.4, ratingCount: 10 } }),
    });
  });

  it("a failed cart leaves the cart empty, and the rest loads", async () => {
    answers.set("/cart", json(500, {}));
    const session = await loadNavbarSession();
    expect(session.kind === "user" && session.cart).toBeNull();
    expect(session.kind === "user" && session.shop).not.toBeNull();
  });

  it("a failed profile uses the username from /auth/me and the default avatar", async () => {
    answers.set("/profile", "network");
    const session = await loadNavbarSession();
    expect(session.kind === "user" && session.user).toEqual({ username: "agus_me", email: "me@x.co", photoUrl: null });
  });

  it("a 404 from /shops/me is 'no shop'", async () => {
    answers.set("/shops/me", json(404, { message: "Shop not found." }));
    const session = await loadNavbarSession();
    expect(session.kind === "user" && session.shop).toEqual({ status: "none" });
  });

  it("any other /shops/me failure leaves the shop empty (the default trigger)", async () => {
    answers.set("/shops/me", json(500, {}));
    const session = await loadNavbarSession();
    expect(session.kind === "user" && session.shop).toBeNull();
  });

  it("a failed public shop keeps the name from /shops/me, without city and rating", async () => {
    answers.set("/shops/bali-fresh-farm", "network");
    const session = await loadNavbarSession();
    expect(session.kind === "user" && session.shop).toMatchObject({ status: "shop", name: "Bali Fresh Farm", city: null, rating: null });
  });

  it("a failed /auth/me (not 401) keeps the user logged in with the profile's data", async () => {
    answers.set("/auth/me", "network");
    const session = await loadNavbarSession();
    expect(session.kind === "user" && session.user.username).toBe("agus_01");
  });
});
