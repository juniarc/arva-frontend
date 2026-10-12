import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "@/lib/api/http";
import { addToCart } from "./add-to-cart";

vi.mock("@/lib/api/http", () => ({ requestJson: vi.fn() }));

const requestJsonMock = vi.mocked(requestJson);

beforeEach(() => requestJsonMock.mockReset());

describe("addToCart", () => {
  it("posts the variant and quantity to our own cart route", async () => {
    requestJsonMock.mockResolvedValue({ ok: true, status: 200, data: { itemCount: 2 } });

    const result = await addToCart({ variantId: "v1", quantity: 2 });

    expect(result).toEqual({ ok: true });
    expect(requestJsonMock).toHaveBeenCalledWith("/api/cart", {
      method: "POST",
      body: { variantId: "v1", quantity: 2 },
    });
  });

  it("returns the backend message for a stock error", async () => {
    requestJsonMock.mockResolvedValue({
      ok: false,
      reason: "http",
      status: 409,
      body: { message: "Only 3 left in stock." },
    });

    expect(await addToCart({ variantId: "v1", quantity: 5 })).toEqual({ ok: false, message: "Only 3 left in stock." });
  });

  it("returns a generic message when the error has no usable body", async () => {
    requestJsonMock.mockResolvedValue({ ok: false, reason: "http", status: 500, body: undefined });

    expect(await addToCart({ variantId: "v1", quantity: 1 })).toEqual({
      ok: false,
      message: "Could not add to cart. Please try again.",
    });
  });

  it("returns a network message when the server cannot be reached", async () => {
    requestJsonMock.mockResolvedValue({ ok: false, reason: "network" });

    expect(await addToCart({ variantId: "v1", quantity: 1 })).toEqual({
      ok: false,
      message: "Unable to reach the server. Please try again.",
    });
  });
});
