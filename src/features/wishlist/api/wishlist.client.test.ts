import { beforeEach, describe, expect, it, vi } from "vitest";
import { addToWishlist, getWishlist, removeFromWishlist } from "./wishlist.client";

const fetchMock = vi.fn();
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

const wishlistBody = { items: [], itemCount: 0 };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("wishlist client", () => {
  it("removeFromWishlist sends DELETE with the item ids and returns the full wishlist", async () => {
    fetchMock.mockResolvedValue(json(200, wishlistBody));

    const result = await removeFromWishlist(["4", "5"]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/wishlist/items");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body as string)).toEqual({ itemIds: ["4", "5"] });
    expect(result).toEqual({ ok: true, wishlist: { items: [], itemCount: 0 } });
  });

  it("addToWishlist sends POST with the product id", async () => {
    fetchMock.mockResolvedValue(json(200, wishlistBody));

    await addToWishlist("7");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/wishlist");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ productId: "7" });
  });

  it("getWishlist sends GET", async () => {
    fetchMock.mockResolvedValue(json(200, wishlistBody));
    await getWishlist();
    expect((fetchMock.mock.calls[0] as [string, RequestInit])[1].method).toBe("GET");
  });

  it("never shows what the server said: a failed removal gives the designed message", async () => {
    fetchMock.mockResolvedValue(json(500, { message: "SQLSTATE 42P01 relation does not exist" }));

    expect(await removeFromWishlist(["1"])).toEqual({
      ok: false,
      message: "Wishlist Failed Removed. Please Try Again.",
    });
  });

  it("gives the same message for a 404 (the endpoint does not exist yet), a network error and a bad body", async () => {
    const expected = { ok: false, message: "Wishlist Failed Removed. Please Try Again." };

    fetchMock.mockResolvedValueOnce(json(404, { message: "Not found." }));
    expect(await removeFromWishlist(["1"])).toEqual(expected);

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await removeFromWishlist(["1"])).toEqual(expected);

    fetchMock.mockResolvedValueOnce(json(200, { unexpected: true }));
    expect(await removeFromWishlist(["1"])).toEqual(expected);
  });
});
