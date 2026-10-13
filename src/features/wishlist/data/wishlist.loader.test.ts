import { beforeEach, describe, expect, it, vi } from "vitest";
import { WishlistMappingError } from "../mappers/wishlist.mapper";
import { loadWishlist, WishlistLoadError } from "./wishlist.loader";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ API_BASE_URL: "http://backend.test/api" }) }));
vi.mock("@/lib/logger", () => ({ logServerError: vi.fn() }));

const fetchMock = vi.fn();
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

const backendWishlist = {
  items: [
    {
      id: 9,
      addedAt: "2026-10-02T10:00:00.000Z",
      product: {
        id: 5,
        slug: "banana",
        name: "Banana",
        categorySlug: "fruits",
        categoryName: "Fruits",
        price: 1000,
        originalPrice: null,
        discountPercent: null,
        rating: 4.5,
        soldCount: 10,
        city: "Kab. Bandung",
        imageUrl: "/b.jpg",
        shop: { slug: "s", name: "S" },
        isAvailable: true,
      },
    },
  ],
  itemCount: 1,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("loadWishlist", () => {
  it("loads the real wishlist with the token and maps it", async () => {
    fetchMock.mockResolvedValue(json(200, backendWishlist));

    const result = await loadWishlist("tok");

    expect(result).toMatchObject({ status: "ok", wishlist: { itemCount: 1, items: [{ id: "9", isAvailable: true }] } });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend.test/api/wishlist");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("reports 401 as unauthorized", async () => {
    fetchMock.mockResolvedValue(json(401, { message: "Please log in." }));
    expect(await loadWishlist("tok")).toEqual({ status: "unauthorized" });
  });

  it("throws a WishlistLoadError while the endpoint does not exist (404)", async () => {
    fetchMock.mockResolvedValue(json(404, { message: "Not found." }));
    await expect(loadWishlist("tok")).rejects.toBeInstanceOf(WishlistLoadError);
  });

  it("throws a WishlistLoadError when the backend cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(loadWishlist("tok")).rejects.toBeInstanceOf(WishlistLoadError);
  });

  it("throws for an item with no shop", async () => {
    const broken = structuredClone(backendWishlist);
    delete (broken.items[0]!.product as { shop?: unknown }).shop;
    fetchMock.mockResolvedValue(json(200, broken));

    await expect(loadWishlist("tok")).rejects.toBeInstanceOf(WishlistMappingError);
  });
});
