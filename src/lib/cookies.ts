import type { NextResponse } from "next/server";

/** Name of the httpOnly cookie that holds the backend access token. */
export const AUTH_COOKIE_NAME = "token";

/** Assumption: the backend token lives about a week. Adjust to the real expiry. */
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Stores the access token in an httpOnly cookie.
 * httpOnly keeps it out of reach of client-side JavaScript (XSS safe), and
 * `secure` is switched on in production so it only travels over HTTPS.
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
}

/** Removes the auth cookie (log out). The attributes must match the ones used to set it. */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
