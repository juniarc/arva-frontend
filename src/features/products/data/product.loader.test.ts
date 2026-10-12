import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeProduct } from "@/features/home/components/home.fixture";
import { makeProductDetail } from "../components/product-page.fixture";
import { getProductDetail as fetchProductDetail, getProducts } from "../api/catalog.server";
import { getProductDetail, getProductPage } from "./product.loader";

vi.mock("server-only", () => ({}));
vi.mock("../api/catalog.server", () => ({ getProductDetail: vi.fn(), getProducts: vi.fn() }));

const fetchDetailMock = vi.mocked(fetchProductDetail);
const getProductsMock = vi.mocked(getProducts);

beforeEach(() => {
  fetchDetailMock.mockReset();
  getProductsMock.mockReset();
  getProductsMock.mockResolvedValue([]);
});

describe("getProductDetail", () => {
  it("returns null for an unknown slug", async () => {
    fetchDetailMock.mockResolvedValue({ ok: false, status: 404, message: "Product not found." });

    expect(await getProductDetail("does-not-exist")).toBeNull();
  });

  it("throws for any other failure so the error page is shown", async () => {
    fetchDetailMock.mockResolvedValue({ ok: false, status: 502, message: "Could not load this product." });

    await expect(getProductDetail("anything")).rejects.toThrow("Could not load this product.");
  });
});

describe("getProductPage", () => {
  it("returns null for an unknown slug", async () => {
    fetchDetailMock.mockResolvedValue({ ok: false, status: 404, message: "Product not found." });

    expect(await getProductPage("does-not-exist")).toBeNull();
  });

  it("builds the page data and splits related products by shop", async () => {
    const product = makeProductDetail({ id: "p1", shopName: "Tani Makmur" });
    fetchDetailMock.mockResolvedValue({ ok: true, product });
    getProductsMock.mockResolvedValue([
      makeProduct(1, { shopName: "Tani Makmur" }),
      makeProduct(2, { shopName: "Tani Makmur" }),
      makeProduct(3, { shopName: "Other Shop" }),
    ]);

    const page = await getProductPage(product.slug);

    expect(page?.shop).toEqual({ slug: "tani-makmur", name: "Tani Makmur", city: product.city });
    expect(page?.images).toEqual([{ id: "p1-main", url: product.imageUrl, alt: product.name }]);
    expect(page?.shopProducts.map((item) => item.id)).toEqual(["p2"]);
    expect(page?.recommended.map((item) => item.id)).toEqual(["p3"]);
    expect(page?.reviews.length).toBeGreaterThanOrEqual(3);
  });
});
