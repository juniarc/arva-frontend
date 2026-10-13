import type { Metadata } from "next";
import { WishlistPage } from "@/features/wishlist/components/WishlistPage";
import { loadWishlist } from "@/features/wishlist/data/wishlist.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Wishlist" };

const WISHLIST_PATH = "/wishlist";

/** Server Component: checks the session, loads the real wishlist, and hands it to the client component. */
export default async function WishlistRoute() {
  const { token } = await requireUser(WISHLIST_PATH);

  const result = await loadWishlist(token);
  if (result.status === "unauthorized") redirectToLogin(WISHLIST_PATH);

  return <WishlistPage initialWishlist={result.wishlist} />;
}
