import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./redirect";

describe("getSafeRedirect", () => {
  it("allows same-site paths", () => {
    expect(getSafeRedirect("/cart")).toBe("/cart");
    expect(getSafeRedirect("/search?q=rice&page=2")).toBe("/search?q=rice&page=2");
  });

  it("falls back when the value is missing", () => {
    expect(getSafeRedirect(undefined)).toBe("/");
    expect(getSafeRedirect(null)).toBe("/");
    expect(getSafeRedirect("")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(getSafeRedirect("//evil.com")).toBe("/");
  });

  it("rejects backslash tricks", () => {
    expect(getSafeRedirect("/\\evil.com")).toBe("/");
  });

  it("rejects absolute and non-http URLs", () => {
    expect(getSafeRedirect("https://evil.com")).toBe("/");
    expect(getSafeRedirect("javascript:alert(1)")).toBe("/");
    expect(getSafeRedirect("evil.com")).toBe("/");
  });

  it("rejects control characters", () => {
    expect(getSafeRedirect("/\t/evil.com")).toBe("/");
  });

  it("rejects repeated query values (array)", () => {
    expect(getSafeRedirect(["/a", "/b"])).toBe("/");
  });

  it("uses a custom fallback", () => {
    expect(getSafeRedirect("//evil.com", "/home")).toBe("/home");
  });
});
