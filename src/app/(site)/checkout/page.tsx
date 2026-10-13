import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutPage } from "@/features/checkout/components/CheckoutPage";
import { loadDraft } from "@/features/checkout/data/checkout.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Checkout" };

const CHECKOUT_PATH = "/checkout";

/**
 * Server Component: checks the session, loads the draft, and hands it to the client component.
 * Without a draft (the user did not come from the cart's Buy button) it goes back to the cart.
 */
export default async function CheckoutRoute() {
  const { token } = await requireUser(CHECKOUT_PATH);

  const result = await loadDraft(token);
  if (result.status === "unauthorized") redirectToLogin(CHECKOUT_PATH);
  if (result.status === "missing") redirect("/cart?notice=checkout_expired");

  return <CheckoutPage initialDraft={result.draft} />;
}
