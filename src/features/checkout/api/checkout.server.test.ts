import { beforeEach, describe, expect, it, vi } from "vitest";
import { addressDto, draftDto } from "../checkout.fixture";
import { proxyToBackend } from "./checkout.server";

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
const call = (method: string, body?: unknown) =>
  new Request("http://localhost/api", { method, body: body === undefined ? undefined : JSON.stringify(body), headers: { "Content-Type": "application/json" } });

const requestBody = () => JSON.parse(((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string) ?? "null");
const requestInit = () => (fetchMock.mock.calls[0] as [string, RequestInit])[1];

// What the browser sends for an address: region ids only, as numeric strings, and no names.
const addressBody = {
  ...addressDto,
  province: { id: "31" },
  city: { id: "3171" },
  district: { id: "317107" },
  subDistrict: { id: "3171071001" },
};

beforeEach(() => {
  cookieValue.token = "tok";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("proxyToBackend", () => {
  it("forwards the token from the cookie as a header, and returns the validated draft", async () => {
    fetchMock.mockResolvedValue(json(200, draftDto()));

    const response = await proxyToBackend(call("GET"), "/checkout");

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://backend.test/api/checkout");
    expect((requestInit().headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect((await response.json()).summary.total).toBe(10000);
  });

  it("answers 401 without calling the backend when there is no cookie", async () => {
    cookieValue.token = undefined;

    const response = await proxyToBackend(call("GET"), "/checkout");

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not forward a route that is not in the table", async () => {
    expect((await proxyToBackend(call("GET"), "/checkout/secret")).status).toBe(404);
    expect((await proxyToBackend(call("DELETE"), "/checkout")).status).toBe(404);
    expect((await proxyToBackend(call("GET"), "/profile/address")).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks the body before the backend sees it", async () => {
    expect((await proxyToBackend(call("POST", { itemIds: [] }), "/checkout")).status).toBe(400);
    expect((await proxyToBackend(call("POST", { itemIds: ["abc"] }), "/checkout")).status).toBe(400);
    expect((await proxyToBackend(call("PUT", { enabled: "yes" }), "/checkout/damage-protection")).status).toBe(400);
    expect((await proxyToBackend(call("PUT", { ...addressBody, phone: "08abc" }), "/checkout/address")).status).toBe(400);
    expect((await proxyToBackend(call("PUT", { ...addressBody, subDistrict: undefined }), "/checkout/address")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards an address with numeric region ids", async () => {
    fetchMock.mockResolvedValue(json(200, draftDto({ address: addressDto })));

    await proxyToBackend(call("PUT", addressBody), "/checkout/address");

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://backend.test/api/checkout/address");
    expect(requestBody()).toEqual(addressBody);
  });

  it("rejects an address with dotted ids, region names or extra fields before the backend sees it", async () => {
    for (const bad of [
      { ...addressBody, city: { id: "31.71" } },
      { ...addressBody, city: { id: "3171", name: "Jakarta Pusat" } },
      { ...addressBody, profileId: 99 },
    ]) {
      expect((await proxyToBackend(call("PUT", bad), "/checkout/address")).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not forward the region lists to the backend (they come from wilayah.id)", async () => {
    const response = await proxyToBackend(call("GET"), "/regions/provinces");

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the 503 CHECKOUT_UNAVAILABLE answer through with its code", async () => {
    fetchMock.mockResolvedValue(json(503, { code: "CHECKOUT_UNAVAILABLE", message: "Checkout is coming soon." }));

    const response = await proxyToBackend(call("POST"), "/checkout/orders");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: "CHECKOUT_UNAVAILABLE", message: "Checkout is coming soon." });
  });

  it("passes a 201 order through", async () => {
    fetchMock.mockResolvedValue(json(201, { order: { id: 9, code: "ORD123" } }));

    const response = await proxyToBackend(call("POST"), "/checkout/orders");

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ order: { id: "9", code: "ORD123" } });
  });

  it("passes a 404 (not built yet, or no draft) through", async () => {
    fetchMock.mockResolvedValue(json(404, { message: "Checkout session not found." }));

    const response = await proxyToBackend(call("GET"), "/checkout");

    expect(response.status).toBe(404);
    expect((await response.json()).message).toBe("Checkout session not found.");
  });

  it("turns other server errors into a 502 with a fixed message, never the backend's text", async () => {
    fetchMock.mockResolvedValue(json(500, { message: "SQLSTATE 42P01 relation does not exist" }));

    const response = await proxyToBackend(call("GET"), "/checkout/vouchers");

    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("SQLSTATE");
  });

  it("answers 502 for a response that does not match the contract", async () => {
    fetchMock.mockResolvedValue(json(200, { unexpected: true }));
    expect((await proxyToBackend(call("GET"), "/checkout")).status).toBe(502);
  });

  it("answers 503 when the backend cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect((await proxyToBackend(call("GET"), "/checkout")).status).toBe(503);
  });
});
