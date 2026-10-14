import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCategories } from "@/features/products/api/catalog.server";
import { CreateShopWizard } from "@/features/shops/components/CreateShopWizard";
import { getMyShop, getShippingChannels } from "@/features/shops/data/shop.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Create Shop" };

const CREATE_PATH = "/my-shop/create";

/** Server Component: checks the session, and sends a user who already has a shop to it (one shop per user). */
export default async function CreateShopRoute() {
  const { token } = await requireUser(CREATE_PATH);

  const [result, channels, categories] = await Promise.all([getMyShop(token), getShippingChannels(), getCategories()]);
  if (result.status === "unauthorized") redirectToLogin(CREATE_PATH);
  if (result.status === "ok") redirect(`/shops/${result.shop.slug}`);

  return <CreateShopWizard channels={channels} categories={categories} />;
}
