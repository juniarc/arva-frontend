import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "./cookies";

/**
 * Whether the visitor has a login cookie. This is a presence check only, like the middleware:
 * the backend still verifies the token on every real request.
 */
export async function isLoggedIn(): Promise<boolean> {
  return (await cookies()).has(AUTH_COOKIE_NAME);
}
