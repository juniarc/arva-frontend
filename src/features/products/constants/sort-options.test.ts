import { describe, expect, it } from "vitest";
import { DESKTOP_SORT_OPTIONS, MOBILE_SORT_OPTIONS, sortOptionFor } from "./sort-options";

const valueOf = (label: string) => DESKTOP_SORT_OPTIONS.find((option) => option.label === label)?.value;

describe("sort options", () => {
  it("maps each label to its API value", () => {
    expect(valueOf("Newest")).toBe("newest");
    expect(valueOf("Most Popular")).toBe("popular");
    expect(valueOf("Price : High to Low")).toBe("price_desc");
    expect(valueOf("Price : Low to High")).toBe("price_asc");
  });

  it("'Most Suitable' sends no sort", () => {
    expect(DESKTOP_SORT_OPTIONS.find((option) => option.label === "Most Suitable")?.value).toBeUndefined();
  });

  it("lists the same options in the desktop and mobile orders", () => {
    expect(DESKTOP_SORT_OPTIONS.map((o) => o.label)).toEqual([
      "Most Suitable",
      "Newest",
      "Most Popular",
      "Price : High to Low",
      "Price : Low to High",
    ]);
    expect(MOBILE_SORT_OPTIONS.map((o) => o.label)).toEqual([
      "Most Suitable",
      "Newest",
      "Price : High to Low",
      "Price : Low to High",
      "Most Popular",
    ]);
  });

  it("finds the option for a URL value, and falls back to Most Suitable", () => {
    expect(sortOptionFor("price_asc").label).toBe("Price : Low to High");
    expect(sortOptionFor("popular").label).toBe("Most Popular");
    expect(sortOptionFor(undefined).label).toBe("Most Suitable");
  });
});
