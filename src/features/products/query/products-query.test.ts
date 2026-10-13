import { describe, expect, it } from "vitest";
import {
  buildProductsHref,
  clearFilters,
  dropUnknownCategory,
  hasActiveFilters,
  parseProductsQuery,
  toApiParams,
  withFilterChange,
  withPage,
} from "./products-query";

describe("parseProductsQuery", () => {
  it("parses valid values", () => {
    expect(
      parseProductsQuery({
        category: "fruits",
        sort: "price_asc",
        discount: "true",
        minPrice: "1000",
        maxPrice: "50000",
        minRating: "4",
        city: "Jakarta",
        page: "3",
      }),
    ).toEqual({
      category: "fruits",
      sort: "price_asc",
      discount: true,
      minPrice: 1000,
      maxPrice: 50000,
      minRating: 4,
      city: "Jakarta",
      page: 3,
    });
  });

  it("uses page 1 and no filters for an empty query", () => {
    expect(parseProductsQuery({})).toEqual({ page: 1 });
  });

  it("drops invalid values", () => {
    const query = parseProductsQuery({
      category: "Not A Slug!",
      sort: "relevance",
      discount: "false",
      minPrice: "abc",
      maxPrice: "-5",
      minRating: "4.5",
      city: "Atlantis",
      page: "0",
    });
    expect(query).toEqual({ page: 1 });
  });

  it("drops a page that is not a whole number", () => {
    expect(parseProductsQuery({ page: "2.5" }).page).toBe(1);
    expect(parseProductsQuery({ page: "abc" }).page).toBe(1);
  });

  it("rejects a minimum price above the maximum", () => {
    const query = parseProductsQuery({ minPrice: "5000", maxPrice: "1000" });
    expect(query.minPrice).toBeUndefined();
    expect(query.maxPrice).toBeUndefined();
  });

  it("keeps a range where the minimum equals the maximum", () => {
    expect(parseProductsQuery({ minPrice: "1000", maxPrice: "1000" })).toMatchObject({ minPrice: 1000, maxPrice: 1000 });
  });

  it("uses the first value when a key is repeated", () => {
    expect(parseProductsQuery({ category: ["seeds", "fruits"] }).category).toBe("seeds");
  });
});

describe("dropUnknownCategory", () => {
  const query = parseProductsQuery({ category: "unknown" });

  it("drops a category that is not in the list", () => {
    expect(dropUnknownCategory(query, ["seeds", "fruits"]).category).toBeUndefined();
  });

  it("keeps a known category", () => {
    expect(dropUnknownCategory(parseProductsQuery({ category: "seeds" }), ["seeds"]).category).toBe("seeds");
  });
});

describe("changing filters", () => {
  const onPageThree = parseProductsQuery({ category: "fruits", page: "3" });

  it("goes back to page 1 when a filter changes", () => {
    expect(withFilterChange(onPageThree, { discount: true })).toMatchObject({ category: "fruits", discount: true, page: 1 });
  });

  it("clears a filter when it is set to undefined", () => {
    expect(withFilterChange(onPageThree, { category: undefined }).category).toBeUndefined();
  });

  it("keeps the filters when only the page changes", () => {
    expect(withPage(onPageThree, 2)).toMatchObject({ category: "fruits", page: 2 });
  });

  it("clearFilters removes everything", () => {
    expect(clearFilters()).toEqual({ page: 1 });
  });
});

describe("buildProductsHref", () => {
  it("is /products when nothing is set", () => {
    expect(buildProductsHref({ page: 1 })).toBe("/products");
  });

  it("leaves out page 1 and writes the rest", () => {
    expect(buildProductsHref({ category: "fruits", discount: true, page: 1 })).toBe("/products?category=fruits&discount=true");
  });

  it("writes page 2 and above, and encodes values", () => {
    expect(buildProductsHref({ city: "Kab. Bogor", page: 2 })).toBe("/products?city=Kab.+Bogor&page=2");
  });
});

describe("toApiParams", () => {
  it("sends only the values that are set, plus page and limit", () => {
    const params = toApiParams({ category: "fruits", page: 2 }, 12);
    expect(params.toString()).toBe("category=fruits&page=2&limit=12");
  });

  it("sends the unsupported filters when they are set", () => {
    const params = toApiParams({ minPrice: 1000, maxPrice: 5000, minRating: 4, city: "Jakarta", page: 1 }, 12);
    expect(params.get("minPrice")).toBe("1000");
    expect(params.get("maxPrice")).toBe("5000");
    expect(params.get("minRating")).toBe("4");
    expect(params.get("city")).toBe("Jakarta");
  });

  it("never sends a sort for 'Most Suitable' (relevance is not supported)", () => {
    expect(toApiParams({ page: 1 }, 12).has("sort")).toBe(false);
  });
});

describe("hasActiveFilters", () => {
  it("ignores the page number", () => {
    expect(hasActiveFilters({ page: 4 })).toBe(false);
    expect(hasActiveFilters({ sort: "newest", page: 1 })).toBe(true);
  });
});
