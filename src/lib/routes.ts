/**
 * Explicit route lists used by the middleware.
 * Each entry matches the path itself and everything below it
 * ("/cart" matches "/cart" and "/cart/anything").
 *
 * When you add a page that needs a signed-in user, add it to PROTECTED_ROUTES.
 */
export const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/search", "/api/auth"];

export const PROTECTED_ROUTES = ["/wishlist", "/cart", "/profile", "/checkout", "/shop", "/my-shop"];

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => matchesRoute(pathname, route));
}
