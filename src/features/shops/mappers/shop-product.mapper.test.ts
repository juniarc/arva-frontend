import { describe, expect, it } from "vitest";
import { manageDto, productItemDto, productsDto } from "../shop.fixture";
import { ShopMappingError } from "./shop.mapper";
import { hasManage, parseShopProducts, variantsText } from "./shop-product.mapper";

describe("parseShopProducts", () => {
  it("maps a public item to the card's product, with manage null", () => {
    const { products, pagination } = parseShopProducts(productsDto());

    expect(products[0]?.manage).toBeNull();
    expect(products[0]?.product).toEqual({
      id: "10",
      slug: "banana-bali",
      name: "Banana Fruits from Bali",
      categorySlug: "",
      categoryName: "Fruit",
      price: 1000,
      originalPrice: undefined,
      discountPercent: undefined,
      rating: 3.4,
      soldCount: 30,
      city: "Jakarta",
      imageUrl: "https://cdn.test/banana.jpg",
      shopSlug: "bali-fresh-farm",
      shopName: "Bali Fresh Farm",
    });
    expect(pagination).toEqual({ page: 1, limit: 8, total: 1, totalPages: 1 });
  });

  it("maps an owner item with its manage fields", () => {
    const [item] = parseShopProducts(productsDto([productItemDto({ manage: manageDto({ isActive: false }) })])).products;

    expect(item && hasManage(item)).toBe(true);
    expect(item?.manage).toEqual({ isActive: false, totalStock: 300, variantLabels: ["Blue", "100 ml"], ratingCount: 10 });
  });

  it("keeps a discount", () => {
    const [item] = parseShopProducts(productsDto([productItemDto({ originalPrice: 2000, discountPercent: 50 })])).products;
    expect(item?.product).toMatchObject({ originalPrice: 2000, discountPercent: 50 });
  });

  it("rejects a wrong shape", () => {
    expect(() => parseShopProducts({ products: [{ id: "1" }] })).toThrow(ShopMappingError);
    expect(() => parseShopProducts(undefined)).toThrow(ShopMappingError);
  });
});

describe("variantsText", () => {
  it("joins the labels for display", () => {
    expect(variantsText(["Blue", "100 ml"])).toBe("Blue, 100 ml");
    expect(variantsText(["500 g"])).toBe("500 g");
  });

  it("shows a dash when there are none", () => {
    expect(variantsText([])).toBe("-");
    expect(variantsText(["  "])).toBe("-");
  });
});
