import { ProductSection } from "@/features/home/components/ProductSection";
import type { ProductPageData } from "../types";
import { DesktopPurchasePanel } from "./DesktopPurchasePanel";
import { ExpandableText } from "./ExpandableText";
import { MobileActionBar } from "./MobileActionBar";
import { ProductGallery } from "./ProductGallery";
import { ProductInfo } from "./ProductInfo";
import { PurchaseProvider } from "./PurchaseProvider";
import { ReviewList } from "./ReviewList";
import { ReviewSummary } from "./ReviewSummary";
import { ShopCard } from "./ShopCard";

const SECTION = "border-t border-line/40 pt-6";
const HEADING = "mb-3 font-serif text-xl font-bold text-ink md:text-2xl";

interface ProductDetailProps {
  data: ProductPageData;
  /** From `isLoggedIn()` in lib/session.ts. */
  isLoggedIn: boolean;
  /** The wishlist entry id when the product is already saved (see getWishlistItemId). */
  wishlistItemId?: string;
}

/**
 * One layout for every screen size, with Tailwind's `lg:` classes switching to the desktop design:
 * - below 1024px: gallery, info, then the sections; buying happens in the modal via the sticky bar.
 * - 1024px and up: gallery on the left, info and the inline purchase panel on the right.
 */
export function ProductDetail({ data, isLoggedIn, wishlistItemId }: ProductDetailProps) {
  const { product, shopProducts, recommended } = data;
  const { shop } = product;

  return (
    <PurchaseProvider product={product} isLoggedIn={isLoggedIn} initialWishlistItemId={wishlistItemId}>
      <div className="mx-auto max-w-300">
        <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-8 lg:px-6 lg:pt-6">
          <ProductGallery images={product.images} />

          <div className="flex flex-col gap-5 px-4 pt-4 md:px-6 lg:px-0 lg:pt-0">
            <ProductInfo product={product} />
            <hr className="hidden border-line/40 lg:block" />
            <DesktopPurchasePanel />
          </div>
        </div>

        <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
          <section className={SECTION} aria-labelledby="description-title">
            <h2 id="description-title" className={HEADING}>
              Description
            </h2>
            <ExpandableText text={product.description || "No description provided."} />
          </section>

          <section className={SECTION} aria-label="Shop">
            <ShopCard shop={shop} />
          </section>

          <section className={SECTION} aria-labelledby="reviews-title">
            <h2 id="reviews-title" className={HEADING}>
              Product Reviews
            </h2>
            <div className="mb-3">
              <ReviewSummary rating={product.rating} />
            </div>
            <ReviewList
              slug={product.slug}
              initialReviews={product.reviewPreview}
              totalCount={product.rating.reviewCount}
            />
          </section>

          {shopProducts.length > 0 && (
            <ProductSection
              title={`Products from ${shop.name}`}
              viewAllHref={`/shops/${shop.slug}`}
              products={shopProducts}
              isLoggedIn={isLoggedIn}
              columns="detail"
            />
          )}

          {recommended.length > 0 && (
            <ProductSection
              title="Recommendation for you"
              viewAllHref="/products"
              products={recommended}
              isLoggedIn={isLoggedIn}
              columns="detail"
            />
          )}
        </div>

        <MobileActionBar />
      </div>
    </PurchaseProvider>
  );
}
