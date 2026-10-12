import { describe, expect, it } from "vitest";
import { formatCurrency, formatSold, slugify } from "./format";

describe("formatCurrency", () => {
  it("formats rupiah with a dot as thousands separator", () => {
    expect(formatCurrency(1000)).toBe("Rp 1.000");
    expect(formatCurrency(25000)).toBe("Rp 25.000");
    expect(formatCurrency(1234567)).toBe("Rp 1.234.567");
  });

  it("does not add a separator below one thousand", () => {
    expect(formatCurrency(950)).toBe("Rp 950");
  });
});

describe("formatSold", () => {
  it("shows the exact count below one thousand", () => {
    expect(formatSold(501)).toBe("501 sold");
  });

  it("shortens larger counts", () => {
    expect(formatSold(1200)).toBe("1.2k sold");
    expect(formatSold(2000)).toBe("2k sold");
  });
});

describe("slugify", () => {
  it("makes a lowercase, dash separated slug", () => {
    expect(slugify("Bali Fresh Farm")).toBe("bali-fresh-farm");
    expect(slugify("  Tani & Makmur!  ")).toBe("tani-makmur");
  });
});
