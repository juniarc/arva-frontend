import "server-only";
import { cookies } from "next/headers";
import { parseProfile } from "@/features/profile/mappers/profile.mapper";
import type { Profile } from "@/features/profile/types";
import { parseMyShop, parseShop } from "@/features/shops/mappers/shop.mapper";
import { requestJson, type HttpResult } from "@/lib/api/http";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { parseMe, parseNavbarCart, toNavbarShop, toNavbarUser } from "./navbar.mapper";
import type { NavbarCart, NavbarSession, NavbarShop } from "./navbar.types";

/**
 * The navbar's data, loaded on the server for every request. Each summary is loaded on its own, in
 * parallel, and a failure only empties that summary. The data is personal, so nothing is cached
 * (requestJson never caches unless asked, and reading the cookie makes the layout dynamic).
 */

const TIMEOUT_MS = 8_000;

function get(token: string, path: string): Promise<HttpResult<unknown>> {
  return requestJson(`${getEnv().API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: TIMEOUT_MS,
  });
}

/** Runs a parser and turns a throw (a wrong shape) into null. */
function safely<T>(parse: () => T): T | null {
  try {
    return parse();
  } catch {
    return null;
  }
}

type MeResult = { status: "ok"; user: { username: string; email: string } } | { status: "unauthorized" } | { status: "unknown" };

/** GET /auth/me. 401 means a guest. Any other failure is "unknown": the cookie is kept and the rest still loads. */
export async function loadMe(token: string): Promise<MeResult> {
  const result = await get(token, "/auth/me");
  if (!result.ok) {
    if (result.reason === "http" && result.status === 401) return { status: "unauthorized" };
    logServerError("navbar.me_failed", { endpoint: "/auth/me", status: result.status, reason: result.reason });
    return { status: "unknown" };
  }
  const user = parseMe(result.data);
  return user ? { status: "ok", user } : { status: "unknown" };
}

/** GET /profile, for the email and the photo. Null on any failure. */
export async function loadProfileSummary(token: string): Promise<Profile | null> {
  const result = await get(token, "/profile");
  if (!result.ok) return null;
  return safely(() => parseProfile(result.data));
}

/** GET /cart. Null on any failure: the trigger stays, without a badge. */
export async function loadCartSummary(token: string): Promise<NavbarCart | null> {
  const result = await get(token, "/cart");
  if (!result.ok) {
    logServerError("navbar.cart_failed", { endpoint: "/cart", status: result.status, reason: result.reason });
    return null;
  }
  return parseNavbarCart(result.data);
}

/**
 * GET /shops/me, then GET /shops/:slug for the city and the rating, which /shops/me does not have.
 * 404 on /shops/me means "no shop". Any other failure is null: the default My Shop trigger.
 */
export async function loadShopSummary(token: string): Promise<NavbarShop | null> {
  const result = await get(token, "/shops/me");
  if (!result.ok) {
    if (result.reason === "http" && result.status === 404) return { status: "none" };
    logServerError("navbar.shop_failed", { endpoint: "/shops/me", status: result.status, reason: result.reason });
    return null;
  }
  const mine = safely(() => parseMyShop(result.data));
  if (!mine) return null;

  const publicResult = await get(token, `/shops/${encodeURIComponent(mine.slug)}`);
  const publicShop = publicResult.ok ? safely(() => parseShop(publicResult.data)) : null;
  return toNavbarShop(mine, publicShop);
}

/** Reads the token cookie and loads every summary. No token, or a 401 from /auth/me, is a guest. */
export async function loadNavbarSession(): Promise<NavbarSession> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return { kind: "guest" };

  const [me, profile, cart, shop] = await Promise.all([
    loadMe(token),
    loadProfileSummary(token),
    loadCartSummary(token),
    loadShopSummary(token),
  ]);
  if (me.status === "unauthorized") return { kind: "guest" };

  return { kind: "user", user: toNavbarUser(me.status === "ok" ? me.user : null, profile), cart, shop };
}
