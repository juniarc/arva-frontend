import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCategories } from "@/features/products/api/catalog.server";
import { EditProductPage } from "@/features/seller-products/components/EditProductPage";
import { getOwnedProduct } from "@/features/seller-products/data/product.loader";
import { getMyShop } from "@/features/shops/data/shop.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Edit Product" };

interface EditProductRouteProps {
  params: Promise<{ id: string }>;
}

/**
 * Server Component: only the owner can edit a product. A user without a shop goes to /my-shop, and
 * someone else's product (or a missing one) shows the not-found page.
 */
export default async function EditProductRoute({ params }: EditProductRouteProps) {
  const { id } = await params;
  const path = `/my-shop/products/${encodeURIComponent(id)}/edit`;
  const { token } = await requireUser(path);

  const [shop, product, categories] = await Promise.all([getMyShop(token), getOwnedProduct(token, id), getCategories()]);
  if (shop.status === "unauthorized" || product.status === "unauthorized") redirectToLogin(path);
  if (shop.status === "none") redirect("/my-shop");
  if (product.status === "not-found") notFound();

  return <EditProductPage shopSlug={shop.shop.slug} product={product.product} categories={categories} />;
}
