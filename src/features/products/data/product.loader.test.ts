import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeProduct } from "@/features/home/components/home.fixture";
import { makeProductDetail } from "../components/product-page.fixture";
import { getProductDetail as fetchProductDetail, getProducts, getRecommendedProducts } from "../api/catalog.server";
import { getProductDetail, getProductPage } from "./product.loader";

vi.mock("server-only", () => ({}));
vi.mock("../api/catalog.server", () => ({
  getProductDetail: vi.fn(),
  getProducts: vi.fn(),
  getRecommendedProducts: vi.fn(),
}));

const fetchDetailMock = vi.mocked(fetchProductDetail);
const getProductsMock = vi.mocked(getProducts);
const getRecommendedMock = vi.mocked(getRecommendedProducts);

beforeEach(() => {
  fetchDetailMock.mockReset();
  getProductsMock.mockReset();
  getRecommendedMock.mockReset();
  getProductsMock.mockResolvedValue([]);
  getRecommendedMock.mockResolvedValue([]);
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
    expect(getProductsMock).not.toHaveBeenCalled();
  });

  it("loads the shop's other products and the recommendations from the API", async () => {
    const product = makeProductDetail({ id: "5" });
    fetchDetailMock.mockResolvedValue({ ok: true, product });
    getProductsMock.mockResolvedValue([makeProduct(2)]);
    getRecommendedMock.mockResolvedValue([makeProduct(3), makeProduct(4)]);

    const page = await getProductPage(product.slug);

    expect(getProductsMock).toHaveBeenCalledWith({ shop: "tani-makmur", exclude: "5", sort: "popular", limit: 6 });
    expect(getRecommendedMock).toHaveBeenCalledWith({ exclude: "5", excludeShop: "tani-makmur", limit: 6 });
    expect(page?.product).toBe(product);
    expect(page?.shopProducts.map((item) => item.id)).toEqual(["p2"]);
    expect(page?.recommended.map((item) => item.id)).toEqual(["p3", "p4"]);
  });
});
