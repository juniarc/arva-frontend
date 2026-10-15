import "server-only";
import { messageFromBody } from "@/lib/api/error-message";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { cartSchema, type AddToCartRequest, type Cart } from "../schemas/cart.schema";

/** Server-only calls to the cart endpoints. They need the user's token, so they never run in the browser. */

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export type AddToCartBackendResult =
  | { ok: true; cart: Cart }
  | { ok: false; status: number; message: string };

/** POST /cart. Adds a variant, or increases its quantity, and returns the full cart. */
export async function addToCartOnBackend(token: string, input: AddToCartRequest): Promise<AddToCartBackendResult> {
  const result = await requestJson(`${getEnv().API_BASE_URL}/cart`, {
    method: "POST",
    body: { variantId: input.variantId, quantity: input.quantity },
    headers: authHeaders(token),
  });

  if (!result.ok) {
    if (result.reason === "network") {
      return { ok: false, status: 503, message: "Unable to reach the server. Please try again." };
    }
    if (result.status === 401) {
      return { ok: false, status: 401, message: "Please log in to add items to your cart." };
    }
    if (result.status >= 500) {
      logServerError("cart.add_failed", { endpoint: "/cart", status: result.status, reason: result.reason });
    }
    return {
      ok: false,
      status: result.status,
      message: messageFromBody(result.body, "Could not add to cart. Please try again."),
    };
  }

  const parsed = cartSchema.safeParse(result.data);
  if (!parsed.success) {
    logServerError("cart.unexpected_response", { endpoint: "/cart", status: result.status });
    return { ok: false, status: 502, message: "Could not add to cart. Please try again." };
  }
  return { ok: true, cart: parsed.data };
}

export type CartMutationResult = { ok: true; cart: Cart } | { ok: false; status: number; message: string };

const MUTATION_TIMEOUT_MS = 8_000;

async function mutateCart(
  token: string,
  method: "PATCH" | "DELETE",
  path: string,
  logPath: string,
  body: unknown,
  fallbackMessage: string,
): Promise<CartMutationResult> {
  const result = await requestJson(`${getEnv().API_BASE_URL}${path}`, {
    method,
    body,
    headers: authHeaders(token),
    timeoutMs: MUTATION_TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "network") {
      return { ok: false, status: 503, message: "Unable to reach the server. Please try again." };
    }
    if (result.status === 401) {
      return { ok: false, status: 401, message: "Please log in again." };
    }
    if (result.status >= 500) {
      logServerError("cart.mutation_failed", { endpoint: logPath, status: result.status, reason: result.reason });
    }
    return { ok: false, status: result.status, message: messageFromBody(result.body, fallbackMessage) };
  }

  const parsed = cartSchema.safeParse(result.data);
  if (!parsed.success) {
    logServerError("cart.unexpected_response", { endpoint: logPath, status: result.status });
    return { ok: false, status: 502, message: fallbackMessage };
  }
  return { ok: true, cart: parsed.data };
}

/** PATCH /cart/items/:id. Sets the quantity and returns the full cart. */
export function updateCartItemOnBackend(token: string, itemId: string, quantity: number): Promise<CartMutationResult> {
  return mutateCart(
    token,
    "PATCH",
    `/cart/items/${encodeURIComponent(itemId)}`,
    "/cart/items/:id",
    { quantity },
    "Could not update the quantity. Please try again.",
  );
}

/** DELETE /cart/items. Removes the given items and returns the full cart. */
export function removeCartItemsOnBackend(token: string, itemIds: string[]): Promise<CartMutationResult> {
  return mutateCart(
    token,
    "DELETE",
    "/cart/items",
    "/cart/items",
    { itemIds },
    "Could not remove the items. Please try again.",
  );
}
