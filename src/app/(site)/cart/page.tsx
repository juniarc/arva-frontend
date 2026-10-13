import type { Metadata } from "next";
import { CartPage } from "@/features/cart/components/CartPage";
import { loadCart } from "@/features/cart/data/cart.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Cart" };

const CART_PATH = "/cart";

/** Server Component: checks the session, loads the real cart, and hands it to the client component. */
export default async function CartRoute() {
  const { token } = await requireUser(CART_PATH);

  const result = await loadCart(token);
  if (result.status === "unauthorized") redirectToLogin(CART_PATH);

  return <CartPage initialCart={result.cart} />;
}
