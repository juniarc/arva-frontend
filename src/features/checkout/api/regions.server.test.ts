import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxyRegions } from "./regions.server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ API_BASE_URL: "http://backend.test/api", REGIONS_API_BASE_URL: "https://wilayah.test" }) }));
vi.mock("@/lib/logger", () => ({ logServerError: vi.fn() }));

const fetchMock = vi.fn();
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const calledUrl = () => fetchMock.mock.calls[0]?.[0];

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("proxyRegions", () => {
  it("loads the provinces from wilayah.id and maps code to id", async () => {
    fetchMock.mockResolvedValue(json(200, { data: [{ code: "11", name: "Aceh" }, { code: "31", name: "DKI Jakarta" }], meta: {} }));

    const response = await proxyRegions(["provinces"]);

    expect(calledUrl()).toBe("https://wilayah.test/api/provinces.json");
    expect(await response.json()).toEqual({ items: [{ id: "11", name: "Aceh" }, { id: "31", name: "DKI Jakarta" }] });
  });

  it("loads cities, districts and sub-districts by their parent's code", async () => {
    fetchMock.mockResolvedValue(json(200, { data: [] }));

    await proxyRegions(["provinces", "31", "cities"]);
    await proxyRegions(["cities", "31.71", "districts"]);
    await proxyRegions(["districts", "31.71.07", "sub-districts"]);

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "https://wilayah.test/api/regencies/31.json",
      "https://wilayah.test/api/districts/31.71.json",
      "https://wilayah.test/api/villages/31.71.07.json",
    ]);
  });

  it("cleans stray spaces in names", async () => {
    fetchMock.mockResolvedValue(json(200, { data: [{ code: "31.72", name: "Kota Administrasi  Jakarta Utara " }] }));

    const response = await proxyRegions(["provinces", "31", "cities"]);

    expect(await response.json()).toEqual({ items: [{ id: "31.72", name: "Kota Administrasi Jakarta Utara" }] });
  });

  it("only calls wilayah.id for well-formed codes, so nothing else can be reached through it", async () => {
    for (const path of [
      ["provinces", "abc", "cities"],
      ["provinces", "31.71", "cities"],
      ["cities", "31", "districts"],
      ["cities", "../../secret", "districts"],
      ["districts", "31.71.07.1001", "sub-districts"],
      ["villages"],
      [],
    ]) {
      expect((await proxyRegions(path)).status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 404 when wilayah.id has no such code", async () => {
    fetchMock.mockResolvedValue(json(404, {}));
    expect((await proxyRegions(["provinces", "99", "cities"])).status).toBe(404);
  });

  it("answers 502 with a fixed message when wilayah.id fails", async () => {
    fetchMock.mockResolvedValue(json(500, { message: "internal detail" }));

    const response = await proxyRegions(["provinces"]);

    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("internal detail");
  });

  it("answers 503 when wilayah.id cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect((await proxyRegions(["provinces"])).status).toBe(503);
  });

  it("answers 502 for a response that is not in the expected shape", async () => {
    fetchMock.mockResolvedValue(json(200, { provinces: [] }));
    expect((await proxyRegions(["provinces"])).status).toBe(502);
  });

  it("asks for the answer to be cached for a day, since the lists are static", async () => {
    fetchMock.mockResolvedValue(json(200, { data: [] }));

    await proxyRegions(["provinces"]);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit & { next?: { revalidate?: number } };
    expect(init.next?.revalidate).toBe(86400);
  });
});
