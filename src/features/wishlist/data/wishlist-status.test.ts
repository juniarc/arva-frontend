import { beforeEach, describe, expect, it, vi } from "vitest";
import { getWishlistItemId } from "./wishlist-status";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ API_BASE_URL: "http://backend.test/api" }) }));
vi.mock("@/lib/logger", () => ({ logServerError: vi.fn() }));

const cookieValue = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "token" && cookieValue.token ? { name, value: cookieValue.token } : undefined),
  }),
}));

const fetchMock = vi.fn();
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

const entry = (id: number, slug: string) => ({
  id,
  addedAt: "2026-10-01T10:00:00Z",
  product: {
    id: id + 100,
    slug,
    name: slug,
    categorySlug: "fruits",
    categoryName: "Fruits",
    price: 1000,
    originalPrice: null,
    discountPercent: null,
    rating: 4,
    soldCount: 1,
    city: "Kab. Bandung",
    imageUrl: "/x.jpg",
    shop: { slug: "s", name: "S" },
    isAvailable: true,
  },
});

beforeEach(() => {
  cookieValue.token = "tok";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("getWishlistItemId", () => {
  it("returns the wishlist entry id of the product", async () => {
    fetchMock.mockResolvedValue(json(200, { items: [entry(3, "banana"), entry(8, "mango")], itemCount: 2 }));
    expect(await getWishlistItemId("mango")).toBe("8");
  });

  it("returns undefined when the product is not saved", async () => {
    fetchMock.mockResolvedValue(json(200, { items: [entry(3, "banana")], itemCount: 1 }));
    expect(await getWishlistItemId("mango")).toBeUndefined();
  });

  it("makes no request for a guest", async () => {
    cookieValue.token = undefined;
    expect(await getWishlistItemId("mango")).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns undefined, instead of breaking the page, when the backend fails", async () => {
    fetchMock.mockResolvedValue(json(500, { message: "boom" }));
    expect(await getWishlistItemId("mango")).toBeUndefined();

    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect(await getWishlistItemId("mango")).toBeUndefined();
  });
});
