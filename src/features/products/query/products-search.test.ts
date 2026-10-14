import { describe, expect, it } from "vitest";
import { buildProductsHref, clearFilters, hasActiveFilters, parseProductsQuery, toApiParams, withFilterChange } from "./products-query";

describe("the search in the products URL", () => {
  it("reads q, trimmed, with repeated spaces made single", () => {
    expect(parseProductsQuery({ q: "  bali   banana " }).q).toBe("bali banana");
  });

  it("drops an empty or too long search", () => {
    expect(parseProductsQuery({ q: "   " }).q).toBeUndefined();
    expect(parseProductsQuery({ q: "a".repeat(101) }).q).toBeUndefined();
    expect(parseProductsQuery({ q: ["seeds", "other"] }).q).toBe("seeds");
  });

  it("keeps the search in links, in the API call, and through filter changes", () => {
    const query = parseProductsQuery({ q: "seeds", category: "seeds" });

    expect(buildProductsHref(query)).toBe("/products?q=seeds&category=seeds");
    expect(toApiParams(query, 12).get("q")).toBe("seeds");
    expect(withFilterChange(query, { discount: true }).q).toBe("seeds");
    expect(hasActiveFilters({ q: "seeds", page: 1 })).toBe(true);
  });

  it("encodes the search in the link", () => {
    expect(buildProductsHref({ q: "bali & banana", page: 1 })).toBe("/products?q=bali+%26+banana");
  });

  it("resetting the filters keeps the search", () => {
    expect(clearFilters("seeds")).toEqual({ q: "seeds", page: 1 });
    expect(clearFilters()).toEqual({ page: 1 });
  });
});
