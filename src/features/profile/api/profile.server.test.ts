// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { profileDto } from "../profile.fixture";
import { proxyProfile } from "./profile.server";

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
  new Request("http://localhost/api/profile", {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const infoBody = { name: "Agus", username: "agus_01", email: "agus@example.com", phone: null };
const addressBody = {
  street: "Jl. Kebon Sirih No. 1",
  province: { id: "31" },
  city: { id: "31.71" },
  district: { id: "31.71.07" },
  subDistrict: { id: "31.71.07.1001" },
  zipCode: "10270",
};

const photoRequest = (file: File | string) => {
  const form = new FormData();
  form.append("photo", file);
  return new Request("http://localhost/api/profile/photo", { method: "PUT", body: form });
};
const png = (bytes = 100, type = "image/png") => new File([new Uint8Array(bytes)], "me.png", { type });

const sent = () => fetchMock.mock.calls[0] as [string, RequestInit];

beforeEach(() => {
  cookieValue.token = "tok";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("proxyProfile: info", () => {
  it("forwards the token from the cookie as a header and returns the validated profile", async () => {
    fetchMock.mockResolvedValue(json(200, profileDto()));

    const response = await proxyProfile(put(infoBody), "info");

    expect(response.status).toBe(200);
    const [url, init] = sent();
    expect(url).toBe("http://backend.test/api/profile");
    expect(init.method).toBe("PUT");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body as string)).toEqual(infoBody);
    expect((await response.json()).user.username).toBe("agus_01");
  });

  it("answers 401 without calling the backend when there is no cookie", async () => {
    cookieValue.token = undefined;

    const response = await proxyProfile(put(infoBody), "info");

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks the body before the backend sees it", async () => {
    for (const body of [{ ...infoBody, email: "nope" }, { ...infoBody, username: "a b" }, { ...infoBody, phone: "" }, { ...infoBody, role: "admin" }, undefined]) {
      expect((await proxyProfile(put(body), "info")).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes a 409 through with the message and the field that is taken", async () => {
    fetchMock.mockResolvedValue(json(409, { message: "This username is already taken.", field: "username" }));

    const response = await proxyProfile(put(infoBody), "info");

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "This username is already taken.", field: "username" });
  });

  it("drops an unknown 409 field", async () => {
    fetchMock.mockResolvedValue(json(409, { message: "Taken.", field: "__proto__" }));
    expect(await (await proxyProfile(put(infoBody), "info")).json()).toEqual({ message: "Taken." });
  });

  it("passes the field messages of a 400 through, and drops anything odd", async () => {
    fetchMock.mockResolvedValue(json(400, { message: "Invalid.", errors: { email: "Bad email.", "../x": "no", name: 5 } }));

    const response = await proxyProfile(put(infoBody), "info");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Invalid.", errors: { email: "Bad email." } });
  });

  it("passes a 404 (not built yet) through", async () => {
    fetchMock.mockResolvedValue(json(404, { message: "Not found." }));
    expect((await proxyProfile(put(infoBody), "info")).status).toBe(404);
  });

  it("turns server errors into a 502 with a fixed message, never the backend's text", async () => {
    fetchMock.mockResolvedValue(json(500, { message: "SQLSTATE 42P01 relation does not exist" }));

    const response = await proxyProfile(put(infoBody), "info");

    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("SQLSTATE");
  });

  it("answers 502 for a response without a user", async () => {
    fetchMock.mockResolvedValue(json(200, { address: null }));
    expect((await proxyProfile(put(infoBody), "info")).status).toBe(502);
  });

  it("answers 503 when the backend cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect((await proxyProfile(put(infoBody), "info")).status).toBe(503);
  });
});

describe("proxyProfile: address", () => {
  it("sends the address to its own endpoint", async () => {
    fetchMock.mockResolvedValue(json(200, profileDto()));

    const response = await proxyProfile(put(addressBody), "address");

    expect(response.status).toBe(200);
    expect(sent()[0]).toBe("http://backend.test/api/profile/address");
    expect(JSON.parse(sent()[1].body as string)).toEqual(addressBody);
  });

  it("rejects a bad zip code or a missing region before the backend sees it", async () => {
    expect((await proxyProfile(put({ ...addressBody, zipCode: "123" }), "address")).status).toBe(400);
    expect((await proxyProfile(put({ ...addressBody, subDistrict: undefined }), "address")).status).toBe(400);
    expect((await proxyProfile(put({ ...addressBody, label: "Home" }), "address")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("proxyProfile: photo", () => {
  it("forwards one image as multipart, with the token", async () => {
    fetchMock.mockResolvedValue(json(200, profileDto()));

    const response = await proxyProfile(photoRequest(png()), "photo");

    expect(response.status).toBe(200);
    const [url, init] = sent();
    expect(url).toBe("http://backend.test/api/profile/photo");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
    const file = (init.body as FormData).get("photo");
    expect(file).toBeInstanceOf(File);
    expect((file as File).type).toBe("image/png");
  });

  it("rejects another format, a file over 2 MB, a missing file and plain text before the backend sees it", async () => {
    expect((await proxyProfile(photoRequest(png(100, "image/gif")), "photo")).status).toBe(400);
    expect((await proxyProfile(photoRequest(png(2 * 1024 * 1024 + 1)), "photo")).status).toBe(400);
    expect((await proxyProfile(photoRequest("not a file"), "photo")).status).toBe(400);
    expect((await proxyProfile(put(infoBody), "photo")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the backend's 404 through (the endpoint is not built yet)", async () => {
    fetchMock.mockResolvedValue(json(404, { message: "Not found." }));
    expect((await proxyProfile(photoRequest(png()), "photo")).status).toBe(404);
  });
});
