import { ShopCard } from "@/features/products/components/ShopCard";
import { searchShops } from "../data/shop.loader";

/**
 * The shops whose name or city matches a search, above the product results. Nothing is shown when no
 * shop matches, or when the shop search fails: the products still answer the search.
 */
export async function ShopMatches({ q }: { q: string }) {
  const shops = await searchShops(q);
  if (shops.length === 0) return null;

  return (
    <section aria-labelledby="shop-matches-heading" className="mb-6">
      <h2 id="shop-matches-heading" className="mb-3 text-sm font-bold text-ink">
        Shops
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shops.map((shop) => (
          <li key={shop.slug} className="rounded-md border border-line/30 p-3">
            <ShopCard
              shop={{
                slug: shop.slug,
                name: shop.name,
                city: shop.city,
                logoUrl: shop.logoUrl ?? undefined,
                rating: shop.rating.ratingCount > 0 ? shop.rating.average : undefined,
                ratingCount: shop.rating.ratingCount > 0 ? shop.rating.ratingCount : undefined,
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
