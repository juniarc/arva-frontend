import { describe, expect, it } from "vitest";
import { toNumericId, toRegionCode } from "./region-code";

describe("region codes", () => {
  it("removes the dots for the backend", () => {
    expect(toNumericId("12")).toBe("12");
    expect(toNumericId("12.11")).toBe("1211");
    expect(toNumericId("12.11.01")).toBe("121101");
    expect(toNumericId("12.11.01.2001")).toBe("1211012001");
  });

  it("puts the dots back by level", () => {
    expect(toRegionCode("province", "12")).toBe("12");
    expect(toRegionCode("city", "1211")).toBe("12.11");
    expect(toRegionCode("district", "121101")).toBe("12.11.01");
    expect(toRegionCode("subDistrict", "1211012001")).toBe("12.11.01.2001");
  });

  it("leaves a dotted id, or one that does not fit the level, as it is", () => {
    expect(toRegionCode("city", "12.11")).toBe("12.11");
    expect(toRegionCode("city", "121")).toBe("121");
    expect(toRegionCode("district", "abcdef")).toBe("abcdef");
  });
});
