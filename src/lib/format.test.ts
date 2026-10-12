import { describe, expect, it } from "vitest";
import { formatCurrency, formatSold, formatTimeAgo } from "./format";

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

describe("formatTimeAgo", () => {
  const now = new Date("2026-10-13T12:00:00Z").getTime();

  it("uses the largest fitting unit", () => {
    expect(formatTimeAgo("2026-10-13T11:59:30Z", now)).toBe("just now");
    expect(formatTimeAgo("2026-10-13T11:55:00Z", now)).toBe("5 minutes ago");
    expect(formatTimeAgo("2026-10-13T09:00:00Z", now)).toBe("3 hours ago");
    expect(formatTimeAgo("2026-10-12T12:00:00Z", now)).toBe("1 day ago");
    expect(formatTimeAgo("2026-10-06T12:00:00Z", now)).toBe("1 week ago");
    expect(formatTimeAgo("2026-08-13T12:00:00Z", now)).toBe("2 months ago");
    expect(formatTimeAgo("2024-10-13T12:00:00Z", now)).toBe("2 years ago");
  });

  it("returns an empty string for an invalid date and never goes negative", () => {
    expect(formatTimeAgo("not a date", now)).toBe("");
    expect(formatTimeAgo("2026-10-14T12:00:00Z", now)).toBe("just now");
  });
});
