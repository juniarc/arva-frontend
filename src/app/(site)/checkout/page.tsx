import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutPage } from "@/features/checkout/components/CheckoutPage";
import { loadDraft, saveDraftAddress } from "@/features/checkout/data/checkout.loader";
import { addressFromProfile, type ProfileAddressPrefill } from "@/features/checkout/mappers/profile-address.mapper";
import type { Address, Draft } from "@/features/checkout/types";
import { loadProfile } from "@/features/profile/data/profile.loader";
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

  const { draft, suggestedAddress } = await withProfileAddress(token, result.draft);
  return <CheckoutPage initialDraft={draft} suggestedAddress={suggestedAddress} />;
}

/** The profile address made ready for checkout, or null when there is none or it cannot be loaded. */
async function profilePrefill(token: string): Promise<ProfileAddressPrefill | null> {
  try {
    const profile = await loadProfile(token);
    return profile.status === "ok" ? addressFromProfile(profile.profile) : null;
  } catch {
    // The profile is only a convenience here: without it, the user types the address.
    return null;
  }
}

/**
 * A new draft has no address. When the profile has one, it is copied into the draft so the user does not
 * type it again. If it is missing something checkout needs (for example a phone), it is not saved: the
 * address form opens with it filled in instead.
 */
async function withProfileAddress(token: string, draft: Draft): Promise<{ draft: Draft; suggestedAddress: Address | null }> {
  if (draft.address) return { draft, suggestedAddress: null };

  const prefill = await profilePrefill(token);
  if (!prefill) return { draft, suggestedAddress: null };

  const saved = prefill.complete ? await saveDraftAddress(token, prefill.address) : null;
  return saved?.address ? { draft: saved, suggestedAddress: null } : { draft, suggestedAddress: prefill.address };
}
