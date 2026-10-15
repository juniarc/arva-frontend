import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import { setAuthCookie } from "@/lib/cookies";
import { POST } from "./route";

/** The parts of a Set-Cookie header, lower-cased, without the value. */
function cookieAttributes(header: string | null): string[] {
  return (header ?? "")
    .split(";")
    .slice(1)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => !part.startsWith("max-age") && !part.startsWith("expires"))
    .sort();
}

describe("POST /api/auth/logout", () => {
  it("answers { ok: true } and empties the token cookie with max-age 0", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const header = response.headers.get("set-cookie");
    expect(header).toMatch(/^token=;/);
    expect(header?.toLowerCase()).toContain("max-age=0");
  });

  it("clears the cookie with the same attributes that set it", async () => {
    const login = NextResponse.json({});
    setAuthCookie(login, "secret-token");
    const logout = await POST();

    expect(cookieAttributes(logout.headers.get("set-cookie"))).toEqual(cookieAttributes(login.headers.get("set-cookie")));
    expect(cookieAttributes(logout.headers.get("set-cookie"))).toEqual(expect.arrayContaining(["httponly", "path=/", "samesite=lax"]));
  });
});
