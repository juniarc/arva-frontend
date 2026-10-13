import { describe, expect, it } from "vitest";
import { makeMyShop, myShopDto, ownerDetailsDto, ownerShopDto, shopDto } from "../shop.fixture";
import { parseMyShop, parseShippingChannels, parseShop, ShopMappingError, toEditRequest, toEditValues } from "./shop.mapper";

describe("parseShop", () => {
  it("maps the shop DTO", () => {
    expect(parseShop({ shop: shopDto() })).toEqual({
      slug: "bali-fresh-farm",
      name: "Bali Fresh Farm",
      city: "Jakarta",
      logoUrl: null,
      description: "Fresh bananas straight from local farmers.",
      operatingHours: { open: "09:00", close: "19:00" },
      rating: { average: 3.4, ratingCount: 10 },
      productCount: 2,
      isOwner: false,
      ownerDetails: null,
    });
  });

  it("keeps ownerDetails null for a guest", () => {
    expect(parseShop({ shop: shopDto() }).ownerDetails).toBeNull();
  });

  it("keeps the owner's details for the owner", () => {
    const shop = parseShop({ shop: ownerShopDto() });
    expect(shop.isOwner).toBe(true);
    expect(shop.ownerDetails?.contact.email).toBe("shop@example.com");
    expect(shop.ownerDetails?.address?.subDistrict.name).toBe("Gelora");
    expect(shop.ownerDetails?.shippingChannels).toHaveLength(2);
  });

  it("drops ownerDetails when the viewer is not the owner, even if the response carried them", () => {
    expect(parseShop({ shop: shopDto({ isOwner: false, ownerDetails: ownerDetailsDto() }) }).ownerDetails).toBeNull();
  });

  it("treats a response without isOwner as not the owner", () => {
    const { isOwner: _isOwner, ...rest } = shopDto();
    expect(parseShop({ shop: rest }).isOwner).toBe(false);
  });

  it("rejects a response with a missing name or slug, or without a shop", () => {
    expect(() => parseShop({ shop: shopDto({ name: "" }) })).toThrow(ShopMappingError);
    expect(() => parseShop({ shop: shopDto({ name: undefined }) })).toThrow(ShopMappingError);
    expect(() => parseShop({ shop: shopDto({ slug: "" }) })).toThrow(ShopMappingError);
    expect(() => parseShop({})).toThrow(ShopMappingError);
    expect(() => parseShop(undefined)).toThrow(ShopMappingError);
  });

  it("rejects hours that are not HH:MM", () => {
    expect(() => parseShop({ shop: shopDto({ operatingHours: { open: "9am", close: "19:00" } }) })).toThrow(ShopMappingError);
  });

  it("only accepts a logo from an http(s) URL or a path on our own site", () => {
    const logo = (logoUrl: string) => parseShop({ shop: shopDto({ logoUrl }) }).logoUrl;
    expect(logo("https://cdn.test/a.png")).toBe("https://cdn.test/a.png");
    expect(logo("/uploads/a.png")).toBe("/uploads/a.png");
    expect(logo("javascript:alert(1)")).toBeNull();
    expect(logo("//evil.test/a.png")).toBeNull();
  });
});

describe("parseMyShop", () => {
  it("maps the owner's shop and turns numeric ids into strings", () => {
    const shop = parseMyShop({ shop: myShopDto({ provinceId: 31, shippingChannelIds: [1, 2] }) });
    expect(shop.provinceId).toBe("31");
    expect(shop.shippingChannelIds).toEqual(["1", "2"]);
    expect(shop.phone).toBe("+6281234567890");
  });

  it("turns the backend's numeric region ids into the region lists' dotted codes", () => {
    const shop = parseMyShop({
      shop: myShopDto({ provinceId: "12", cityId: "1201", districtId: "120105", subDistrictId: "1201052001" }),
    });
    expect([shop.provinceId, shop.cityId, shop.districtId, shop.subDistrictId]).toEqual(["12", "12.01", "12.01.05", "12.01.05.2001"]);
  });

  it("keeps a missing phone as null", () => {
    expect(parseMyShop({ shop: myShopDto({ phone: null }) }).phone).toBeNull();
  });

  it("rejects a response without a shop, name or slug", () => {
    expect(() => parseMyShop({})).toThrow(ShopMappingError);
    expect(() => parseMyShop({ shop: myShopDto({ name: "" }) })).toThrow(ShopMappingError);
  });

  it("gives the same shop when its own output is parsed again", () => {
    const once = makeMyShop();
    expect(parseMyShop({ shop: once })).toEqual(once);
  });
});

describe("parseShippingChannels", () => {
  it("maps the list, and rejects a wrong shape", () => {
    expect(parseShippingChannels({ items: [{ id: 1, name: "JNE" }] })).toEqual([{ id: "1", name: "JNE" }]);
    expect(() => parseShippingChannels({ channels: [] })).toThrow(ShopMappingError);
  });
});

describe("edit form mappers", () => {
  it("fills the form from the owner's shop, with an empty string for no phone", () => {
    expect(toEditValues(makeMyShop({ phone: null }))).toMatchObject({
      name: "Bali Fresh Farm",
      provinceId: "31",
      subDistrictId: "31.71.07.1001",
      phone: "",
      openingTime: "09:00",
      closingTime: "19:00",
      shippingChannelIds: ["1"],
    });
  });

  it("builds the request: trimmed, email in lowercase, null for an empty phone", () => {
    const values = { ...toEditValues(makeMyShop()), name: "  New Name ", email: " Shop@Example.COM ", phone: "" };
    expect(toEditRequest(values)).toMatchObject({ name: "New Name", email: "shop@example.com", phone: null });
  });

  it("sends the region ids as numeric strings, without the dots", () => {
    expect(toEditRequest(toEditValues(makeMyShop()))).toMatchObject({
      provinceId: "31",
      cityId: "3171",
      districtId: "317107",
      subDistrictId: "3171071001",
    });
  });
});
