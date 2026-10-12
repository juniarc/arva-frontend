import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { cookieGet, addToCartOnBackend } = vi.hoisted(() => ({ cookieGet: vi.fn(), addToCartOnBackend: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));
vi.mock("@/features/cart/api/cart.server", () => ({ addToCartOnBackend }));

function request(body: unknown): Request {
  return new Request("http://localhost/api/cart", { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => {
  cookieGet.mockReset();
  addToCartOnBackend.mockReset();
});

describe("POST /api/cart", () => {
  it("returns 401 without a login cookie and does not call the backend", async () => {
    cookieGet.mockReturnValue(undefined);

    const response = await POST(request({ variantId: "v1", quantity: 1 }));

    expect(response.status).toBe(401);
    expect(addToCartOnBackend).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid body", async () => {
    cookieGet.mockReturnValue({ value: "token" });

    const response = await POST(request({ variantId: "v1", quantity: 0 }));

    expect(response.status).toBe(400);
    expect(addToCartOnBackend).not.toHaveBeenCalled();
  });

  it("forwards the token from the cookie and returns the item count", async () => {
    cookieGet.mockReturnValue({ value: "token" });
    addToCartOnBackend.mockResolvedValue({ ok: true, cart: { itemCount: 3 } });

    const response = await POST(request({ variantId: "v1", quantity: 2 }));

    expect(addToCartOnBackend).toHaveBeenCalledWith("token", { variantId: "v1", quantity: 2 });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ itemCount: 3 });
  });

  it("passes backend errors through with their status and message", async () => {
    cookieGet.mockReturnValue({ value: "token" });
    addToCartOnBackend.mockResolvedValue({ ok: false, status: 409, message: "This variant is out of stock." });

    const response = await POST(request({ variantId: "v1", quantity: 1 }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "This variant is out of stock." });
  });
});
