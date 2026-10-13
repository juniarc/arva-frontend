import { describe, expect, it } from "vitest";
import { withRegionChange } from "./address-regions";

const jakarta = { id: "1", name: "DKI Jakarta" };

describe("withRegionChange", () => {
  it("changing the province clears the city, district and sub-district", () => {
    expect(withRegionChange("province", jakarta)).toEqual({
      province: jakarta,
      city: undefined,
      district: undefined,
      subDistrict: undefined,
    });
  });

  it("changing the city clears the district and sub-district, and leaves the province alone", () => {
    const changes = withRegionChange("city", { id: "11", name: "Jakarta Pusat" });

    expect(changes).toEqual({
      city: { id: "11", name: "Jakarta Pusat" },
      district: undefined,
      subDistrict: undefined,
    });
    expect("province" in changes).toBe(false);
  });

  it("changing the district clears only the sub-district", () => {
    expect(withRegionChange("district", { id: "111", name: "Tanah Abang" })).toEqual({
      district: { id: "111", name: "Tanah Abang" },
      subDistrict: undefined,
    });
  });

  it("changing the sub-district clears nothing else", () => {
    expect(withRegionChange("subDistrict", { id: "1111", name: "Kebon Melati" })).toEqual({
      subDistrict: { id: "1111", name: "Kebon Melati" },
    });
  });

  it("clearing a level also clears the ones below it", () => {
    expect(withRegionChange("province", undefined)).toEqual({
      province: undefined,
      city: undefined,
      district: undefined,
      subDistrict: undefined,
    });
  });
});
