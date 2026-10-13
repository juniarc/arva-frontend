import type { Metadata } from "next";
import { CartPage } from "@/features/cart/components/CartPage";
import { loadCart } from "@/features/cart/data/cart.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Cart" };

const CART_PATH = "/cart";

/** Messages other pages can ask the cart to show (?notice=...). Only known keys are accepted. */
const NOTICES: Record<string, string> = {
  checkout_expired: "Your checkout session has expired. Please select your items again.",
};

/** Server Component: checks the session, loads the real cart, and hands it to the client component. */
export default async function CartRoute({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { token } = await requireUser(CART_PATH);

  const result = await loadCart(token);
  if (result.status === "unauthorized") redirectToLogin(CART_PATH);

  return <CartPage initialCart={result.cart} initialNotice={notice ? NOTICES[notice] : undefined} />;
}
