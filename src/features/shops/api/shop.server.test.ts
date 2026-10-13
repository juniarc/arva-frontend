import { beforeEach, describe, expect, it, vi } from "vitest";
import { myShopDto } from "../shop.fixture";
import { proxyCreateShop, proxyUpdateMyShop } from "./shop.server";

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
const put = (body?: unknown) =>
  new Request("http://localhost/api/shops/me", {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const body = {
  name: "Bali Fresh Farm",
  provinceId: "31",
  cityId: "31.71",
  districtId: "31.71.07",
  subDistrictId: "31.71.07.1001",
  street: "Jl. Kebon Sirih No. 1",
  shippingChannelIds: ["1"],
  email: "shop@example.com",
  phone: null,
  openingTime: "09:00",
  closingTime: "19:00",
};

beforeEach(() => {
  cookieValue.token = "tok";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("proxyUpdateMyShop", () => {
  it("forwards the token from the cookie and returns the validated shop", async () => {
    fetchMock.mockResolvedValue(json(200, { shop: myShopDto() }));

    const response = await proxyUpdateMyShop(put(body));

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend.test/api/shops/me");
    expect(init.method).toBe("PUT");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body as string)).toEqual(body);
    expect((await response.json()).shop.slug).toBe("bali-fresh-farm");
  });

  it("answers 401 without calling the backend when there is no cookie", async () => {
    cookieValue.token = undefined;

    expect((await proxyUpdateMyShop(put(body))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks the body before the backend sees it", async () => {
    for (const bad of [{ ...body, name: "ab" }, { ...body, closingTime: "08:00" }, { ...body, shippingChannelIds: [] }, { ...body, isOwner: true }, undefined]) {
      expect((await proxyUpdateMyShop(put(bad))).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes a 409 through with the message and the field", async () => {
    fetchMock.mockResolvedValue(json(409, { message: "This shop name is already taken.", field: "name" }));

    const response = await proxyUpdateMyShop(put(body));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "This shop name is already taken.", field: "name" });
  });

  it("passes a 400 with its field messages through, and drops anything odd", async () => {
    fetchMock.mockResolvedValue(json(400, { message: "Invalid.", errors: { cityId: "Wrong province.", "../x": "no" } }));

    const response = await proxyUpdateMyShop(put(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Invalid.", errors: { cityId: "Wrong province." } });
  });

  it("passes a 404 through, and turns server errors into a 502 with a fixed message", async () => {
    fetchMock.mockResolvedValueOnce(json(404, { message: "Shop not found." }));
    expect((await proxyUpdateMyShop(put(body))).status).toBe(404);

    fetchMock.mockResolvedValueOnce(json(500, { message: "SQLSTATE 42P01" }));
    const response = await proxyUpdateMyShop(put(body));
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("SQLSTATE");
  });

  it("answers 502 for a response that is not a shop, and 503 when the backend cannot be reached", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { nope: true }));
    expect((await proxyUpdateMyShop(put(body))).status).toBe(502);

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await proxyUpdateMyShop(put(body))).status).toBe(503);
  });
});

describe("proxyCreateShop", () => {
  const createBody = body;
  const post = (payload?: unknown) =>
    new Request("http://localhost/api/shops", {
      method: "POST",
      body: payload === undefined ? undefined : JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

  it("posts to /shops with the token and returns the created shop with its 201", async () => {
    fetchMock.mockResolvedValue(json(201, { shop: myShopDto() }));

    const response = await proxyCreateShop(post(createBody));

    expect(response.status).toBe(201);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend.test/api/shops");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body as string)).toEqual(createBody);
    expect((await response.json()).shop.slug).toBe("bali-fresh-farm");
  });

  it("answers 401 without a cookie, and checks the body before the backend sees it", async () => {
    cookieValue.token = undefined;
    expect((await proxyCreateShop(post(createBody))).status).toBe(401);

    cookieValue.token = "tok";
    for (const bad of [{ ...createBody, name: "ab" }, { ...createBody, ownerName: "Agus" }, { ...createBody, icNumber: "3171234567890001" }, undefined]) {
      expect((await proxyCreateShop(post(bad))).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes a 409 through", async () => {
    fetchMock.mockResolvedValue(json(409, { message: "You already have a shop." }));

    const response = await proxyCreateShop(post(createBody));

    expect(response.status).toBe(409);
  });

  it("turns server errors into a 502 with a fixed message", async () => {
    fetchMock.mockResolvedValue(json(500, { message: "SQLSTATE 42P01" }));

    const response = await proxyCreateShop(post(createBody));

    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("SQLSTATE");
  });
});
