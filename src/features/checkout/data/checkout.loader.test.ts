import { beforeEach, describe, expect, it, vi } from "vitest";
import { draftDto } from "../checkout.fixture";
import { CheckoutMappingError } from "../mappers/checkout.mapper";
import { CheckoutLoadError, loadDraft } from "./checkout.loader";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ API_BASE_URL: "http://backend.test/api" }) }));
vi.mock("@/lib/logger", () => ({ logServerError: vi.fn() }));

const fetchMock = vi.fn();
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("loadDraft", () => {
  it("loads the draft with the token and maps it", async () => {
    fetchMock.mockResolvedValue(json(200, draftDto()));

    const result = await loadDraft("tok");

    expect(result).toMatchObject({ status: "ok", draft: { items: [{ id: "7" }], summary: { total: 10000 } } });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend.test/api/checkout");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("reports 404 as missing (no draft)", async () => {
    fetchMock.mockResolvedValue(json(404, { message: "Checkout session not found." }));
    expect(await loadDraft("tok")).toEqual({ status: "missing" });
  });

  it("reports 401 as unauthorized", async () => {
    fetchMock.mockResolvedValue(json(401, { message: "Please log in." }));
    expect(await loadDraft("tok")).toEqual({ status: "unauthorized" });
  });

  it("throws a CheckoutLoadError when the backend fails or cannot be reached", async () => {
    fetchMock.mockResolvedValueOnce(json(500, { message: "boom" }));
    await expect(loadDraft("tok")).rejects.toBeInstanceOf(CheckoutLoadError);

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(loadDraft("tok")).rejects.toBeInstanceOf(CheckoutLoadError);
  });

  it("throws a CheckoutMappingError for a draft with no summary", async () => {
    const { summary: _summary, ...broken } = draftDto();
    fetchMock.mockResolvedValue(json(200, broken));
    await expect(loadDraft("tok")).rejects.toBeInstanceOf(CheckoutMappingError);
  });
});
