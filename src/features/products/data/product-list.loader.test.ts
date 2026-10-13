import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductListMappingError } from "../mappers/product-list.mapper";
import { getProductList, ProductListError } from "./product-list.loader";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ API_BASE_URL: "http://backend.test/api" }) }));
vi.mock("@/lib/logger", () => ({ logServerError: vi.fn() }));

const fetchMock = vi.fn();

const okBody = {
  products: [
    {
      id: 1,
      slug: "banana",
      name: "Banana",
      categorySlug: "fruits",
      categoryName: "Fruits",
      price: 1000,
      originalPrice: null,
      discountPercent: null,
      rating: 4.5,
      soldCount: 10,
      city: "Kab. Bandung",
      imageUrl: "/b.jpg",
      shopSlug: "s",
      shopName: "S",
    },
  ],
  pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

const calledUrl = (index = 0) => (fetchMock.mock.calls[index] as [string, RequestInit])[0];
const calledInit = (index = 0) => (fetchMock.mock.calls[index] as [string, RequestInit])[1] as RequestInit & {
  next?: { revalidate?: number };
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("getProductList", () => {
  it("loads and maps the list", async () => {
    fetchMock.mockResolvedValue(json(200, okBody));

    const result = await getProductList({ page: 1 });

    expect(result.products[0]).toMatchObject({ id: "1", shopSlug: "s", shopName: "S" });
    expect(result.pagination.total).toBe(1);
    expect(result.filtersDropped).toBe(false);
  });

  it("sends the filters, page and the page size to the backend", async () => {
    fetchMock.mockResolvedValue(json(200, okBody));

    await getProductList({ category: "fruits", sort: "price_asc", discount: true, minPrice: 1000, city: "Jakarta", page: 2 });

    const url = new URL(calledUrl());
    expect(url.origin + url.pathname).toBe("http://backend.test/api/products");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      category: "fruits",
      sort: "price_asc",
      discount: "true",
      minPrice: "1000",
      city: "Jakarta",
      page: "2",
      limit: "12",
    });
  });

  it("caches the default query for 60 seconds", async () => {
    fetchMock.mockResolvedValue(json(200, okBody));
    await getProductList({ page: 1 });
    expect(calledInit().next?.revalidate).toBe(60);
  });

  it("does not cache a query that has the user's choices", async () => {
    fetchMock.mockResolvedValue(json(200, okBody));
    await getProductList({ category: "fruits", page: 1 });
    expect(calledInit().cache).toBe("no-store");
  });

  it("on a 400, loads the list again without the filters and says so", async () => {
    fetchMock
      .mockResolvedValueOnce(json(400, { message: "Please fix the highlighted fields." }))
      .mockResolvedValueOnce(json(200, okBody));

    const result = await getProductList({ category: "fruits", discount: true, page: 2 });

    expect(result.filtersDropped).toBe(true);
    expect(Object.fromEntries(new URL(calledUrl(1)).searchParams)).toEqual({ page: "2", limit: "12" });
  });

  it("throws when the backend fails", async () => {
    fetchMock.mockResolvedValue(json(500, { message: "boom" }));
    await expect(getProductList({ page: 1 })).rejects.toBeInstanceOf(ProductListError);
  });

  it("throws when the backend cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(getProductList({ page: 1 })).rejects.toBeInstanceOf(ProductListError);
  });

  it("throws for an unexpected response shape", async () => {
    fetchMock.mockResolvedValue(json(200, { items: [] }));
    await expect(getProductList({ page: 1 })).rejects.toBeInstanceOf(ProductListMappingError);
  });
});
