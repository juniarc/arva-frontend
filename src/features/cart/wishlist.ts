/**
 * The single place that decides what tapping a heart does. UI only for now: it flips the product
 * in a local set. The wishlist feature will replace this with a call to the wishlist API.
 */
export function toggleWishlist(wishlisted: ReadonlySet<string>, productId: string): Set<string> {
  const next = new Set(wishlisted);
  if (next.has(productId)) next.delete(productId);
  else next.add(productId);
  return next;
}
