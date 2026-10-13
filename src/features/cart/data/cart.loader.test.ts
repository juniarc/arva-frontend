import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartMappingError } from "../mappers/cart.mapper";
import { CartLoadError, loadCart } from "./cart.loader";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ API_BASE_URL: "http://backend.test/api" }) }));
vi.mock("@/lib/logger", () => ({ logServerError: vi.fn() }));

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

const backendCart = {
  items: [
    {
      id: 1,
      quantity: 2,
      product: { id: 3, slug: "banana", name: "Banana", imageUrl: "/b.jpg", shop: { slug: "kebun-bali", name: "Kebun Bali" } },
      variant: { id: 4, label: "1 kg", unit: "kg", price: 2000, stock: 9 },
    },
  ],
  itemCount: 2,
  subtotal: 4000,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("loadCart", () => {
  it("loads the real cart with the token and maps it", async () => {
    respond(200, backendCart);

    const result = await loadCart("tok");

    expect(result).toMatchObject({ status: "ok", cart: { itemCount: 2, items: [{ id: "1", name: "Banana" }] } });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend.test/api/cart");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("reports an empty cart as ok with no items", async () => {
    respond(200, { items: [], itemCount: 0, subtotal: 0 });
    expect(await loadCart("tok")).toMatchObject({ status: "ok", cart: { items: [] } });
  });

  it("reports 401 as unauthorized", async () => {
    respond(401, { message: "Please log in." });
    expect(await loadCart("tok")).toEqual({ status: "unauthorized" });
  });

  it("throws a CartLoadError for other failures", async () => {
    respond(500, { message: "boom" });
    await expect(loadCart("tok")).rejects.toBeInstanceOf(CartLoadError);
  });

  it("throws a CartMappingError for an unexpected response shape", async () => {
    respond(200, { items: [{ id: 1 }] });
    await expect(loadCart("tok")).rejects.toBeInstanceOf(CartMappingError);
  });
});
