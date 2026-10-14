// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_PRODUCT, toCreateRequest } from "../mappers/product-form.mapper";
import { proxyCreateProduct, proxyDeleteProduct, proxyUpdateProduct } from "./product.server";

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

const data = toCreateRequest({
  ...EMPTY_PRODUCT,
  name: "Banana",
  description: "Sweet.",
  categoryId: "2",
  variants: [{ label: "1 kg", price: "10000", stock: "3", unit: "kg" }],
  weightGrams: "300",
  widthCm: "20",
  lengthCm: "30",
  heightCm: "10",
  shippingFee: "1000",
});

const png = (bytes = 100, type = "image/png") => new File([new Uint8Array(bytes)], "banana.png", { type });

function post(options: { data?: unknown; photos?: (File | string)[] } = {}) {
  const form = new FormData();
  if (options.data !== undefined) form.append("data", typeof options.data === "string" ? options.data : JSON.stringify(options.data));
  for (const photo of options.photos ?? []) form.append("images", photo);
  return new Request("http://localhost/api/products", { method: "POST", body: form });
}

beforeEach(() => {
  cookieValue.token = "tok";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("proxyCreateProduct", () => {
  it("forwards the product and the photos as multipart, with the token, and returns the new product", async () => {
    fetchMock.mockResolvedValue(json(201, { product: { id: 42, slug: "banana" } }));

    const response = await proxyCreateProduct(post({ data, photos: [png(), png()] }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ product: { id: "42", slug: "banana" } });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend.test/api/products");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
    const sent = init.body as FormData;
    expect(JSON.parse(sent.get("data") as string)).toEqual(data);
    expect(sent.getAll("images")).toHaveLength(2);
  });

  it("answers 401 without a cookie, and calls nothing", async () => {
    cookieValue.token = undefined;
    expect((await proxyCreateProduct(post({ data, photos: [png()] }))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks the product and every photo before the backend sees them", async () => {
    const cases = [
      post({ data: "not json", photos: [png()] }),
      post({ data: { ...data, shopId: "9" }, photos: [png()] }),
      post({ data }),
      post({ data, photos: [png(), png(), png(), png(), png(), png()] }),
      post({ data, photos: [png(100, "image/gif")] }),
      post({ data, photos: [png(2 * 1024 * 1024 + 1)] }),
      post({ data, photos: ["not a file"] }),
    ];
    for (const request of cases) expect((await proxyCreateProduct(request)).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes a 400 with its field messages through", async () => {
    fetchMock.mockResolvedValue(json(400, { message: "Please fix the highlighted fields.", errors: { categoryId: "Choose a category." } }));

    const response = await proxyCreateProduct(post({ data, photos: [png()] }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Please fix the highlighted fields.", errors: { categoryId: "Choose a category." } });
  });

  it("turns a server error into a 502 with a fixed message, and a network failure into 503", async () => {
    fetchMock.mockResolvedValueOnce(json(500, { message: "disk full at /var/uploads" }));
    const failed = await proxyCreateProduct(post({ data, photos: [png()] }));
    expect(failed.status).toBe(502);
    expect(JSON.stringify(await failed.json())).not.toContain("disk");

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await proxyCreateProduct(post({ data, photos: [png()] }))).status).toBe(503);
  });
});

describe("proxyUpdateProduct", () => {
  const update = { ...data, variants: [{ id: "1", ...data.variants[0] }], keepImageIds: ["11"] };
  const put = (options: { data?: unknown; photos?: File[] } = {}) => {
    const form = new FormData();
    if (options.data !== undefined) form.append("data", JSON.stringify(options.data));
    for (const photo of options.photos ?? []) form.append("images", photo);
    return new Request("http://localhost/api/products/mine/42", { method: "PUT", body: form });
  };

  it("forwards the edit, with no new photo, to the owner's product", async () => {
    fetchMock.mockResolvedValue(json(200, { product: { id: 42, slug: "banana" } }));

    const response = await proxyUpdateProduct(put({ data: update }), "42");

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend.test/api/products/mine/42");
    expect(init.method).toBe("PUT");
    expect(JSON.parse((init.body as FormData).get("data") as string)).toEqual(update);
  });

  it("rejects a bad id, a bad body or a bad photo before the backend sees it", async () => {
    expect((await proxyUpdateProduct(put({ data: update }), "../x")).status).toBe(404);
    expect((await proxyUpdateProduct(put({ data: { ...update, keepImageIds: ["a"] } }), "42")).status).toBe(400);
    expect((await proxyUpdateProduct(put({ data: update, photos: [png(100, "image/gif")] }), "42")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the backend's 404 (someone else's product) through", async () => {
    fetchMock.mockResolvedValue(json(404, { message: "Product not found." }));
    expect((await proxyUpdateProduct(put({ data: update }), "42")).status).toBe(404);
  });
});

describe("proxyDeleteProduct", () => {
  it("deletes with the token and answers 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const response = await proxyDeleteProduct("42");

    expect(response.status).toBe(204);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend.test/api/products/mine/42");
    expect(init.method).toBe("DELETE");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("answers 404 for a bad id and 401 without a cookie, calling nothing", async () => {
    expect((await proxyDeleteProduct("abc")).status).toBe(404);
    cookieValue.token = undefined;
    expect((await proxyDeleteProduct("42")).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes a 404 through", async () => {
    fetchMock.mockResolvedValue(json(404, { message: "Product not found." }));
    expect((await proxyDeleteProduct("42")).status).toBe(404);
  });
});
