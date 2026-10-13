import "server-only";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { CartMappingError, parseCart } from "../mappers/cart.mapper";
import type { CartData } from "../types";

const LOAD_TIMEOUT_MS = 8_000;

export type CartLoadResult = { status: "ok"; cart: CartData } | { status: "unauthorized" };

/** The cart could not be loaded for a reason other than "not logged in". */
export class CartLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CartLoadError";
  }
}

/** GET /cart with the user's token. Failures throw, so the route's error page shows. */
export async function loadCart(token: string): Promise<CartLoadResult> {
  const result = await requestJson(`${getEnv().API_BASE_URL}/cart`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: LOAD_TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "http" && result.status === 401) return { status: "unauthorized" };
    logServerError("cart.load_failed", { endpoint: "/cart", status: result.status, reason: result.reason });
    throw new CartLoadError("Could not load the cart.");
  }

  try {
    return { status: "ok", cart: parseCart(result.data) };
  } catch (error) {
    if (error instanceof CartMappingError) {
      logServerError("cart.unexpected_response", { endpoint: "/cart", status: result.status });
    }
    throw error;
  }
}
