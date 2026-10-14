import { redirect } from "next/navigation";
import { buildProductsHref, parseProductsQuery, type RawSearchParams } from "@/features/products/query/products-query";

interface SearchPageProps {
  searchParams: Promise<RawSearchParams>;
}

/**
 * The header's search box sends people to /search?q=... The results are the products page with the
 * search, so filters, sort and pagination work the same. An empty search shows all products.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = parseProductsQuery(await searchParams);
  redirect(buildProductsHref({ q, page: 1 }));
}
