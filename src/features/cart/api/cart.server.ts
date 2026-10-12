import "server-only";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { cartSchema, type AddToCartRequest, type Cart } from "../schemas/cart.schema";

/** Server-only calls to the cart endpoints. They need the user's token, so they never run in the browser. */

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function messageFrom(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    const { message } = body;
    if (typeof message === "string" && message.trim().length > 0) return message.trim().slice(0, 200);
  }
  return fallback;
}

/** GET /cart. Returns undefined when the cart cannot be read (not logged in, token expired, backend down). */
export async function getCart(token: string): Promise<Cart | undefined> {
  const result = await requestJson(`${getEnv().API_BASE_URL}/cart`, { headers: authHeaders(token) });
  if (!result.ok) return undefined;

  const parsed = cartSchema.safeParse(result.data);
  return parsed.success ? parsed.data : undefined;
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
      message: messageFrom(result.body, "Could not add to cart. Please try again."),
    };
  }

  const parsed = cartSchema.safeParse(result.data);
  if (!parsed.success) {
    logServerError("cart.unexpected_response", { endpoint: "/cart", status: result.status });
    return { ok: false, status: 502, message: "Could not add to cart. Please try again." };
  }
  return { ok: true, cart: parsed.data };
}
