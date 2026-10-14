import { beforeEach, describe, expect, it, vi } from "vitest";
import { myShopDto, productsDto, shopDto } from "../shop.fixture";
import { ShopMappingError } from "../mappers/shop.mapper";
import { getMyShop, getShippingChannels, getShop, getShopProducts, isValidShopSlug, ShopLoadError } from "./shop.loader";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ API_BASE_URL: "http://backend.test/api" }) }));
vi.mock("@/lib/logger", () => ({ logServerError: vi.fn() }));

const fetchMock = vi.fn();
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const authHeader = (call = 0) => ((fetchMock.mock.calls[call]?.[1] as RequestInit).headers as Record<string, string>).Authorization;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("isValidShopSlug", () => {
  it("accepts a slug and rejects anything that could change the path", () => {
    expect(isValidShopSlug("bali-fresh-farm")).toBe(true);
    for (const slug of ["", "a/b", "..", "a b", "a?x=1", "a%2fb", "x".repeat(101)]) expect(isValidShopSlug(slug), slug).toBe(false);
  });
});

describe("getShop", () => {
  it("loads the shop for a guest, without an Authorization header", async () => {
    fetchMock.mockResolvedValue(json(200, { shop: shopDto() }));

    const result = await getShop("bali-fresh-farm");

    expect(result.status).toBe("ok");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://backend.test/api/shops/bali-fresh-farm");
    expect(authHeader()).toBeUndefined();
  });

  it("forwards the token when there is one", async () => {
    fetchMock.mockResolvedValue(json(200, { shop: shopDto() }));
    await getShop("bali-fresh-farm", "secret");
    expect(authHeader()).toBe("Bearer secret");
  });

  it("asks again as a guest when the backend refuses the token (401), and does not redirect", async () => {
    fetchMock.mockResolvedValueOnce(json(401, { message: "Invalid token" })).mockResolvedValueOnce(json(200, { shop: shopDto() }));

    const result = await getShop("bali-fresh-farm", "expired");

    expect(result.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authHeader(0)).toBe("Bearer expired");
    expect(authHeader(1)).toBeUndefined();
  });

  it("reports an unknown shop (404) as not found", async () => {
    fetchMock.mockResolvedValue(json(404, { message: "Shop not found." }));
    expect(await getShop("nope")).toEqual({ status: "not-found" });
  });

  it("reports a slug that is not a slug as not found, without calling the backend", async () => {
    expect(await getShop("../me")).toEqual({ status: "not-found" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tries once more when the backend cannot be reached right away (for example while it restarts)", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce(json(200, { shop: shopDto() }));

    expect((await getShop("bali-fresh-farm")).status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws for a server error, a network failure that stays, and a bad shape", async () => {
    fetchMock.mockResolvedValueOnce(json(500, { message: "boom" }));
    await expect(getShop("a")).rejects.toBeInstanceOf(ShopLoadError);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(getShop("a")).rejects.toBeInstanceOf(ShopLoadError);
    fetchMock.mockReset();

    fetchMock.mockResolvedValueOnce(json(200, { shop: shopDto({ name: "" }) }));
    await expect(getShop("a")).rejects.toBeInstanceOf(ShopMappingError);
  });
});

describe("getShopProducts", () => {
  it("asks for the page with the shop's page size", async () => {
    fetchMock.mockResolvedValue(json(200, productsDto()));

    const result = await getShopProducts("bali-fresh-farm", 2, "secret");

    expect(result.status).toBe("ok");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://backend.test/api/shops/bali-fresh-farm/products?page=2&limit=8");
    expect(authHeader()).toBe("Bearer secret");
  });

  it("returns an error result, not a throw, when the products cannot be loaded", async () => {
    fetchMock.mockResolvedValueOnce(json(500, { message: "boom" }));
    expect(await getShopProducts("a", 1)).toEqual({ status: "error" });

    fetchMock.mockResolvedValueOnce(json(404, { message: "Not found" }));
    expect(await getShopProducts("a", 1)).toEqual({ status: "error" });

    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect(await getShopProducts("a", 1)).toEqual({ status: "error" });
    fetchMock.mockReset();

    fetchMock.mockResolvedValueOnce(json(200, { products: "nope" }));
    expect(await getShopProducts("a", 1)).toEqual({ status: "error" });
  });
});

describe("getMyShop", () => {
  it("loads the owner's shop with the token", async () => {
    fetchMock.mockResolvedValue(json(200, { shop: myShopDto() }));

    const result = await getMyShop("secret");

    expect(result.status).toBe("ok");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://backend.test/api/shops/me");
    expect(authHeader()).toBe("Bearer secret");
  });

  it("reports 404 as no shop and 401 as unauthorized", async () => {
    fetchMock.mockResolvedValueOnce(json(404, { message: "Shop not found." }));
    expect(await getMyShop("t")).toEqual({ status: "none" });

    fetchMock.mockResolvedValueOnce(json(401, { message: "Unauthorized" }));
    expect(await getMyShop("t")).toEqual({ status: "unauthorized" });
  });

  it("throws for any other failure", async () => {
    fetchMock.mockResolvedValueOnce(json(500, { message: "boom" }));
    await expect(getMyShop("t")).rejects.toBeInstanceOf(ShopLoadError);

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(getMyShop("t")).rejects.toBeInstanceOf(ShopLoadError);
  });
});

describe("getShippingChannels", () => {
  it("loads the list, and returns null when it cannot", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { items: [{ id: "1", name: "JNE" }] }));
    expect(await getShippingChannels()).toEqual([{ id: "1", name: "JNE" }]);

    fetchMock.mockResolvedValueOnce(json(404, { message: "Not found" }));
    expect(await getShippingChannels()).toBeNull();

    fetchMock.mockResolvedValueOnce(json(200, { nope: 1 }));
    expect(await getShippingChannels()).toBeNull();
  });
});
