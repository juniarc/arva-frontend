import { withRegionChange } from "@/features/checkout/state/address-regions";
import { describe, expect, it } from "vitest";
import { regionFromId, toIdChanges, toNumericId, toRegionCode } from "./shop-regions";

const province = { id: "32", name: "Jawa Barat" };
const city = { id: "32.73", name: "Kota Bandung" };

describe("toIdChanges", () => {
  it("changing a province sets it and clears the city, district and sub-district", () => {
    expect(toIdChanges(withRegionChange("province", province))).toEqual({
      provinceId: "32",
      cityId: "",
      districtId: "",
      subDistrictId: "",
    });
  });

  it("changing a city keeps the province and clears the district and sub-district", () => {
    expect(toIdChanges(withRegionChange("city", city))).toEqual({ cityId: "32.73", districtId: "", subDistrictId: "" });
  });

  it("changing a sub-district clears nothing else", () => {
    expect(toIdChanges(withRegionChange("subDistrict", { id: "32.73.01.1001", name: "X" }))).toEqual({ subDistrictId: "32.73.01.1001" });
  });

  it("choosing the empty option clears that level and the ones below", () => {
    expect(toIdChanges(withRegionChange("province", undefined))).toEqual({
      provinceId: "",
      cityId: "",
      districtId: "",
      subDistrictId: "",
    });
  });
});

describe("regionFromId", () => {
  it("is undefined for an empty id, and an id-only region otherwise", () => {
    expect(regionFromId("")).toBeUndefined();
    expect(regionFromId("31")).toEqual({ id: "31", name: "" });
  });
});

describe("numeric ids for the backend", () => {
  it("removes the dots of a wilayah.id code", () => {
    expect(toNumericId("12")).toBe("12");
    expect(toNumericId("12.01")).toBe("1201");
    expect(toNumericId("12.01.05")).toBe("120105");
    expect(toNumericId("12.01.05.2001")).toBe("1201052001");
  });

  it("puts the dots back by level", () => {
    expect(toRegionCode("provinceId", "12")).toBe("12");
    expect(toRegionCode("cityId", "1201")).toBe("12.01");
    expect(toRegionCode("districtId", "120105")).toBe("12.01.05");
    expect(toRegionCode("subDistrictId", "1201052001")).toBe("12.01.05.2001");
  });

  it("goes both ways without losing anything", () => {
    for (const [field, code] of [["cityId", "31.71"], ["districtId", "31.71.07"], ["subDistrictId", "31.71.07.1001"]] as const) {
      expect(toRegionCode(field, toNumericId(code))).toBe(code);
    }
  });

  it("leaves an id alone when it is already dotted or does not fit the level", () => {
    expect(toRegionCode("cityId", "31.71")).toBe("31.71");
    expect(toRegionCode("cityId", "120")).toBe("120");
    expect(toRegionCode("districtId", "abcdef")).toBe("abcdef");
    expect(toRegionCode("subDistrictId", "")).toBe("");
  });
});
