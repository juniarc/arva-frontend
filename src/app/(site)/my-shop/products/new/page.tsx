import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCategories } from "@/features/products/api/catalog.server";
import { NewProductPage } from "@/features/seller-products/components/NewProductPage";
import { getMyShop } from "@/features/shops/data/shop.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Upload Product" };

const NEW_PRODUCT_PATH = "/my-shop/products/new";

/** Server Component: only a shop owner can list a product. A user without a shop goes to /my-shop. */
export default async function NewProductRoute() {
  const { token } = await requireUser(NEW_PRODUCT_PATH);

  const [result, categories] = await Promise.all([getMyShop(token), getCategories()]);
  if (result.status === "unauthorized") redirectToLogin(NEW_PRODUCT_PATH);
  if (result.status === "none") redirect("/my-shop");

  return <NewProductPage shopSlug={result.shop.slug} categories={categories} />;
}
