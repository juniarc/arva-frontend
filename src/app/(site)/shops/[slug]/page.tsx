import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { ShopPage } from "@/features/shops/components/ShopPage";
import { getShop, getShopProducts } from "@/features/shops/data/shop.loader";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";

interface ShopRouteProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

const MAX_PAGE = 100_000;

/** A positive whole number, or 1. Nothing else from the URL reaches the API. */
function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{1,6}$/.test(raw)) return 1;
  return Math.min(Math.max(Number(raw), 1), MAX_PAGE);
}

/**
 * The token is optional: a visitor without one (or with one the backend refuses) is a guest.
 * It is forwarded to the backend, which decides `isOwner`. It never reaches the browser.
 */
async function readToken(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value;
}

// generateMetadata and the page both need the shop, so share one load per request.
const loadShop = cache(async (slug: string) => getShop(slug, await readToken()));

export async function generateMetadata({ params }: ShopRouteProps): Promise<Metadata> {
  const result = await loadShop((await params).slug);
  if (result.status !== "ok") return { title: "Shop not found" };
  const { shop } = result;
  return {
    title: shop.name,
    description: shop.description ? shop.description.slice(0, 160) : `Shop fresh products from ${shop.name} on Arva.`,
  };
}

export default async function ShopRoute({ params, searchParams }: ShopRouteProps) {
  const [{ slug }, query, token] = await Promise.all([params, searchParams, readToken()]);
  const page = parsePage(query.page);

  const [shopResult, products] = await Promise.all([loadShop(slug), getShopProducts(slug, page, token)]);
  if (shopResult.status === "not-found") notFound();

  // A page number past the end (for example from an old link): show the last valid page instead.
  if (products.status === "ok" && page > Math.max(1, products.pagination.totalPages)) {
    const last = Math.max(1, products.pagination.totalPages);
    redirect(last === 1 ? `/shops/${slug}` : `/shops/${slug}?page=${last}`);
  }

  return <ShopPage shop={shopResult.shop} products={products} isLoggedIn={token !== undefined} />;
}
