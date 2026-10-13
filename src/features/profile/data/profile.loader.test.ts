import { beforeEach, describe, expect, it, vi } from "vitest";
import { profileDto } from "../profile.fixture";
import { loadProfile, ProfileLoadError } from "./profile.loader";
import { ProfileMappingError } from "../mappers/profile.mapper";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ API_BASE_URL: "http://backend.test/api" }) }));
vi.mock("@/lib/logger", () => ({ logServerError: vi.fn() }));

const fetchMock = vi.fn();
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("loadProfile", () => {
  it("loads the profile with the user's token", async () => {
    fetchMock.mockResolvedValue(json(200, profileDto()));

    const result = await loadProfile("secret");

    expect(result.status).toBe("ok");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://backend.test/api/profile");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer secret" });
  });

  it("reports a 401 as unauthorized", async () => {
    fetchMock.mockResolvedValue(json(401, { message: "Unauthorized" }));
    expect(await loadProfile("t")).toEqual({ status: "unauthorized" });
  });

  it("throws for a 404 (endpoint not built yet), a server error and a network failure", async () => {
    fetchMock.mockResolvedValueOnce(json(404, { message: "Not found" }));
    await expect(loadProfile("t")).rejects.toBeInstanceOf(ProfileLoadError);

    fetchMock.mockResolvedValueOnce(json(500, { message: "boom" }));
    await expect(loadProfile("t")).rejects.toBeInstanceOf(ProfileLoadError);

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(loadProfile("t")).rejects.toBeInstanceOf(ProfileLoadError);
  });

  it("throws for a response without a user", async () => {
    fetchMock.mockResolvedValue(json(200, { address: null }));
    await expect(loadProfile("t")).rejects.toBeInstanceOf(ProfileMappingError);
  });
});
