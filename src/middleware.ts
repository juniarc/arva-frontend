import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";
import { isProtectedRoute } from "@/lib/routes";

/**
 * Sends visitors without a token to /login for protected routes.
 * This only checks that a token exists. The backend still verifies it on
 * every real request, so an expired or forged token is rejected there.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isProtectedRoute(pathname) && !request.cookies.has(AUTH_COOKIE_NAME)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
