export interface BuyNowInput {
  variantId: string;
  quantity: number;
}

export type BuyNowResult = { ok: true } | { ok: false; message: string };

/** Stub: checkout is not built yet. Replace with the real buy-now call when the checkout feature starts. */
export async function buyNow(input: BuyNowInput): Promise<BuyNowResult> {
  void input;
  return { ok: false, message: "Checkout is coming soon." };
}
