export interface AddToCartInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export type AddToCartResult = { ok: true } | { ok: false; message: string };

/** Set to true to see how the modal handles a failed request. */
const SIMULATE_FAILURE = false;

const STUB_DELAY_MS = 600;

/**
 * Stub: waits a moment and succeeds. The real call goes to POST /api/cart when the cart
 * feature is built. Keep this signature so the modal does not need to change.
 */
export async function addToCart(input: AddToCartInput): Promise<AddToCartResult> {
  void input;
  await new Promise((resolve) => setTimeout(resolve, STUB_DELAY_MS));

  if (SIMULATE_FAILURE) return { ok: false, message: "Could not add to cart. Please try again." };
  return { ok: true };
}
