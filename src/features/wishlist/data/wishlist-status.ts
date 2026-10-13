import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";
import { readWishlistOnBackend } from "../api/wishlist.server";

/**
 * For the product page: the wishlist entry id if the logged-in user has saved this product, otherwise
 * `undefined`. Guests, and any failure, also give `undefined`: the heart simply starts empty, and the
 * page never breaks because of the wishlist.
 */
export async function getWishlistItemId(productSlug: string): Promise<string | undefined> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return undefined;

  const result = await readWishlistOnBackend(token);
  if (!result.ok) return undefined;

  return result.wishlist.items.find((item) => item.product.slug === productSlug)?.id;
}
