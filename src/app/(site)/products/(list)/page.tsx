import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/features/products/components/ProductGrid";
import { ProductListPage } from "@/features/products/components/ProductListPage";
import { ProductResults } from "@/features/products/components/ProductResults";
import { getCategories } from "@/features/products/api/catalog.server";
import {
  buildProductsHref,
  dropUnknownCategory,
  parseProductsQuery,
  type RawSearchParams,
} from "@/features/products/query/products-query";
import { ShopMatches } from "@/features/shops/components/ShopMatches";
import { isLoggedIn } from "@/lib/session";

interface ProductsPageProps {
  searchParams: Promise<RawSearchParams>;
}

/** Reads the URL, and drops values that are invalid or unknown. Nothing raw goes to the API. */
async function resolveQuery(searchParams: Promise<RawSearchParams>) {
  const parsed = parseProductsQuery(await searchParams);
  const categories = await getCategories();
  // If the category list could not be loaded, keep the slug: the backend will judge it.
  const query = categories.length > 0 ? dropUnknownCategory(parsed, categories.map((item) => item.slug)) : parsed;
  return { query, categories };
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const { query, categories } = await resolveQuery(searchParams);
  if (query.q) return { title: `Search: ${query.q}` };
  const category = categories.find((item) => item.slug === query.category);
  return { title: category?.name ?? "Products" };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [{ query, categories }, loggedIn] = await Promise.all([resolveQuery(searchParams), isLoggedIn()]);

  return (
    <ProductListPage
      query={query}
      categories={categories}
      shops={
        query.q ? (
          <Suspense key={query.q} fallback={null}>
            <ShopMatches q={query.q} />
          </Suspense>
        ) : undefined
      }
    >
      {/* The key makes the skeleton show again on every filter or page change. */}
      <Suspense key={buildProductsHref(query)} fallback={<ProductGridSkeleton />}>
        <ProductResults query={query} isLoggedIn={loggedIn} />
      </Suspense>
    </ProductListPage>
  );
}
