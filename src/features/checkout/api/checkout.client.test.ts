import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDraft, placeOrder, saveAddress } from "./checkout.client";

const fetchMock = vi.fn();
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("placeOrder", () => {
  it("calls the orders endpoint", async () => {
    fetchMock.mockResolvedValue(json(201, { order: { id: 9, code: "ORD9" } }));

    expect(await placeOrder()).toEqual({ ok: true, data: { id: "9", code: "ORD9" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("failures", () => {
  it("shows a 4xx message from the server", async () => {
    fetchMock.mockResolvedValue(json(400, { message: "Select at least one item." }));
    expect(await createDraft(["1"])).toMatchObject({ ok: false, status: 400, message: "Select at least one item." });
  });

  it("never shows a 5xx message", async () => {
    fetchMock.mockResolvedValue(json(500, { message: "SQLSTATE 42P01" }));

    const result = await createDraft(["1"]);

    expect(result).toMatchObject({ ok: false, status: 500, message: "Could not start checkout. Please try again." });
  });

  it("reports a network error with status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    expect(await createDraft(["1"])).toEqual({
      ok: false,
      status: 0,
      message: "Unable to reach the server. Please try again.",
    });
  });

  it("reports a body that does not match the contract as a 502", async () => {
    fetchMock.mockResolvedValue(json(200, { unexpected: true }));
    expect(await createDraft(["1"])).toMatchObject({ ok: false, status: 502 });
  });

  it("only ever calls our own checkout routes, never a profile route", async () => {
    fetchMock.mockResolvedValue(json(404, { message: "Not found." }));

    await saveAddress({
      label: "Home",
      province: { id: "1", name: "A" },
      city: { id: "2", name: "B" },
      district: { id: "3", name: "C" },
      subDistrict: { id: "4", name: "D" },
      street: "Jl. X",
      recipientName: "Agus",
      phone: "081234567890",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/checkout/address");
    expect(init.method).toBe("PUT");
  });
});
