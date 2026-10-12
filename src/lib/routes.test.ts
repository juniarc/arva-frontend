import { describe, expect, it } from "vitest";
import { isProtectedRoute, isPublicRoute } from "./routes";

describe("route lists", () => {
  it("protects listed routes and their children", () => {
    expect(isProtectedRoute("/cart")).toBe(true);
    expect(isProtectedRoute("/profile/settings")).toBe(true);
  });

  it("does not protect public routes", () => {
    expect(isProtectedRoute("/login")).toBe(false);
    expect(isProtectedRoute("/")).toBe(false);
    expect(isPublicRoute("/api/auth/login")).toBe(true);
  });

  it("does not match on a shared prefix only", () => {
    expect(isProtectedRoute("/cartoon")).toBe(false);
  });
});
