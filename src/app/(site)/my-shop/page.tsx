import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyShopState } from "@/features/shops/components/EmptyShopState";
import { getMyShop } from "@/features/shops/data/shop.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "My Shop" };

const MY_SHOP_PATH = "/my-shop";

/** Sends the owner to their shop, or shows "Let's Open Your Shop" when they have none. */
export default async function MyShopRoute() {
  const { token } = await requireUser(MY_SHOP_PATH);

  const result = await getMyShop(token);
  if (result.status === "unauthorized") redirectToLogin(MY_SHOP_PATH);
  if (result.status === "ok") redirect(`/shops/${result.shop.slug}`);

  return <EmptyShopState />;
}
