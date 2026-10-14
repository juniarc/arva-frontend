import "server-only";
import { requestJson, type HttpResult } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { parseMyShop, parseShippingChannels, parseShop, parseShopMatches, ShopMappingError, type ShopMatch } from "../mappers/shop.mapper";
import { parseShopProducts, type ShopProductsPage } from "../mappers/shop-product.mapper";
import type { MyShop, ShippingChannel, Shop } from "../types";

const LOAD_TIMEOUT_MS = 8_000;
export const SHOP_PRODUCTS_PAGE_SIZE = 8;

/** Only slugs of this shape reach the backend, so nothing else can be put into the path. */
const SLUG = /^[A-Za-z0-9_-]{1,100}$/;
export const isValidShopSlug = (slug: string) => SLUG.test(slug);

/** The shop could not be loaded for a reason other than "not found". The route's error page shows. */
export class ShopLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopLoadError";
  }
}

/**
 * GET with the viewer's token when there is one. These endpoints are public, so a token that the backend
 * refuses (401) is not an error: the request is sent again as a guest.
 */
async function getForViewer(path: string, token: string | undefined): Promise<HttpResult<unknown>> {
  const url = `${getEnv().API_BASE_URL}${path}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const first = await getOnceMore(url, headers);
  if (token && !first.ok && first.reason === "http" && first.status === 401) {
    return getOnceMore(url, undefined);
  }
  return first;
}

/** A connection refused at once (for example while the backend restarts) is tried once more. */
const QUICK_FAILURE_MS = 2_000;
const RETRY_DELAY_MS = 500;

/**
 * GET, and once more after a short pause when the backend could not be reached right away. A request
 * that ran into the timeout is not repeated, so a page never waits twice as long.
 */
async function getOnceMore(url: string, headers: Record<string, string> | undefined): Promise<HttpResult<unknown>> {
  const startedAt = Date.now();
  const first = await requestJson(url, { headers, timeoutMs: LOAD_TIMEOUT_MS });
  if (first.ok || first.reason !== "network" || Date.now() - startedAt > QUICK_FAILURE_MS) return first;

  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  return requestJson(url, { headers, timeoutMs: LOAD_TIMEOUT_MS });
}

export type ShopLoadResult = { status: "ok"; shop: Shop } | { status: "not-found" };

/** GET /shops/:slug. Not found is a result; any other failure throws. */
export async function getShop(slug: string, token?: string): Promise<ShopLoadResult> {
  if (!isValidShopSlug(slug)) return { status: "not-found" };

  const result = await getForViewer(`/shops/${slug}`, token);
  if (!result.ok) {
    if (result.reason === "http" && result.status === 404) return { status: "not-found" };
    logServerError("shop.load_failed", { endpoint: "/shops/:slug", status: result.status, reason: result.reason });
    throw new ShopLoadError("Could not load the shop.");
  }

  try {
    return { status: "ok", shop: parseShop(result.data) };
  } catch (error) {
    if (error instanceof ShopMappingError) {
      logServerError("shop.unexpected_response", { endpoint: "/shops/:slug", status: result.status });
    }
    throw error;
  }
}

export type ShopProductsResult = ({ status: "ok" } & ShopProductsPage) | { status: "error" };

/** GET /shops/:slug/products. A failure is a result, so the shop header stays on screen. */
export async function getShopProducts(slug: string, page: number, token?: string): Promise<ShopProductsResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(SHOP_PRODUCTS_PAGE_SIZE) });
  const result = await getForViewer(`/shops/${slug}/products?${params.toString()}`, token);

  if (!result.ok) {
    logServerError("shop.products_failed", { endpoint: "/shops/:slug/products", status: result.status, reason: result.reason });
    return { status: "error" };
  }

  try {
    return { status: "ok", ...parseShopProducts(result.data) };
  } catch (error) {
    if (!(error instanceof ShopMappingError)) throw error;
    logServerError("shop.products_unexpected_response", { endpoint: "/shops/:slug/products", status: result.status });
    return { status: "error" };
  }
}

export type MyShopResult = { status: "ok"; shop: MyShop } | { status: "none" } | { status: "unauthorized" };

/** GET /shops/me with the user's token. 404 means "no shop yet". Other failures throw. */
export async function getMyShop(token: string): Promise<MyShopResult> {
  const result = await requestJson(`${getEnv().API_BASE_URL}/shops/me`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: LOAD_TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "http" && result.status === 401) return { status: "unauthorized" };
    if (result.reason === "http" && result.status === 404) return { status: "none" };
    logServerError("shop.me_failed", { endpoint: "/shops/me", status: result.status, reason: result.reason });
    throw new ShopLoadError("Could not load your shop.");
  }

  try {
    return { status: "ok", shop: parseMyShop(result.data) };
  } catch (error) {
    if (error instanceof ShopMappingError) {
      logServerError("shop.me_unexpected_response", { endpoint: "/shops/me", status: result.status });
    }
    throw error;
  }
}

/** GET /shipping-channels. Returns null when it cannot be loaded: the form then says so and disables Save. */
export async function getShippingChannels(): Promise<ShippingChannel[] | null> {
  const result = await requestJson(`${getEnv().API_BASE_URL}/shipping-channels`, { timeoutMs: LOAD_TIMEOUT_MS });
  if (!result.ok) {
    logServerError("shop.channels_failed", { endpoint: "/shipping-channels", status: result.status, reason: result.reason });
    return null;
  }
  try {
    return parseShippingChannels(result.data);
  } catch (error) {
    if (!(error instanceof ShopMappingError)) throw error;
    logServerError("shop.channels_unexpected_response", { endpoint: "/shipping-channels", status: result.status });
    return null;
  }
}

const SHOP_MATCH_LIMIT = 6;
/** Shop search results are public and the same for everyone, so they can be kept briefly. */
const SHOP_MATCH_REVALIDATE_SECONDS = 60;

/** GET /shops?q=: up to 6 shops whose name or city matches. Any failure is an empty list. */
export async function searchShops(q: string): Promise<ShopMatch[]> {
  const params = new URLSearchParams({ q, limit: String(SHOP_MATCH_LIMIT) });
  const result = await requestJson(`${getEnv().API_BASE_URL}/shops?${params.toString()}`, {
    timeoutMs: LOAD_TIMEOUT_MS,
    revalidateSeconds: SHOP_MATCH_REVALIDATE_SECONDS,
  });
  if (!result.ok) {
    logServerError("shop.search_failed", { endpoint: "/shops", status: result.status, reason: result.reason });
    return [];
  }
  try {
    return parseShopMatches(result.data);
  } catch (error) {
    if (!(error instanceof ShopMappingError)) throw error;
    logServerError("shop.search_unexpected_response", { endpoint: "/shops", status: result.status });
    return [];
  }
}
