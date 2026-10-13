import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackButton } from "@/features/products/components/BackButton";
import { ShopEditForm } from "@/features/shops/components/ShopEditForm";
import { getMyShop, getShippingChannels } from "@/features/shops/data/shop.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Edit Shop Information" };

const EDIT_PATH = "/my-shop/edit";

/** Server Component: checks the session, loads the owner's shop and the shipping channels, and hands them to the form. */
export default async function EditShopRoute() {
  const { token } = await requireUser(EDIT_PATH);

  const [result, channels] = await Promise.all([getMyShop(token), getShippingChannels()]);
  if (result.status === "unauthorized") redirectToLogin(EDIT_PATH);
  if (result.status === "none") redirect("/my-shop");

  return (
    <>
      <div className="flex items-center px-2 py-1 lg:hidden">
        <BackButton className="bg-transparent shadow-none" />
      </div>
      <div className="mx-auto max-w-300 px-4 pb-10 pt-2 lg:px-6 lg:pt-8">
        <h1 id="shop-edit-heading" className="mb-4 text-center font-serif text-xl font-bold text-ink lg:mb-6 lg:text-left lg:text-3xl">
          Edit Shop Information
        </h1>
        <ShopEditForm shop={result.shop} channels={channels} />
      </div>
    </>
  );
}
