import { requestJson } from "@/lib/api/http";

export interface AddToCartInput {
  variantId: string;
  quantity: number;
}

export type AddToCartResult = { ok: true } | { ok: false; message: string };

const GENERIC_FAILURE = "Could not add to cart. Please try again.";

/** Browser-side: adds a variant to the cart through our own POST /api/cart route. */
export async function addToCart(input: AddToCartInput): Promise<AddToCartResult> {
  const result = await requestJson("/api/cart", { method: "POST", body: input });

  if (result.ok) return { ok: true };

  if (result.reason === "network") {
    return { ok: false, message: "Unable to reach the server. Please try again." };
  }

  const body = result.body;
  if (typeof body === "object" && body !== null && "message" in body) {
    const { message } = body;
    if (typeof message === "string" && message.length > 0) return { ok: false, message };
  }
  return { ok: false, message: GENERIC_FAILURE };
}
