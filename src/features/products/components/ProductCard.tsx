import { MapPin } from "lucide-react";
import Link from "next/link";
import { Price } from "@/components/ui/Price";
import { Rating } from "@/components/ui/Rating";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatSold } from "@/lib/format";
import type { Product } from "../types";
import { AddToCartButton } from "./AddToCartButton";
import { WishlistCardActions } from "./WishlistCardActions";

interface ProductCardProps {
  product: Product;
  isLoggedIn?: boolean;
  /**
   * Turns on wishlist mode: a heart and a wide "Add To Cart" button replace the small cart icon.
   * Leave it out and the card is the normal one, and the props below are ignored.
   */
  wishlistState?: "none" | "in-wishlist";
  onWishlistClick?: () => void;
  /** Wishlist mode: the page decides what happens (it opens the add-to-cart modal). */
  onAddToCartClick?: () => void;
  /** Wishlist mode: set to false to hide the heart. */
  showWishlistButton?: boolean;
  /** Wishlist mode: disables "Add To Cart" and shows "Out of stock". */
  outOfStock?: boolean;
}

/** Generic product card. The whole card is clickable through the stretched name link. */
export function ProductCard({
  product,
  isLoggedIn = false,
  wishlistState,
  onWishlistClick,
  onAddToCartClick,
  showWishlistButton = true,
  outOfStock = false,
}: ProductCardProps) {
  const wishlistMode = wishlistState !== undefined;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-md border border-line/30 bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-surface">
        <SafeImage
          src={product.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 65vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-[10px] text-muted">{product.categoryName}</p>
        <h3 className="line-clamp-2 min-h-10 text-sm text-ink">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-info"
          >
            {product.name}
          </Link>
        </h3>

        <Price
          amount={product.price}
          originalAmount={product.originalPrice}
          discountPercent={product.discountPercent}
        />

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col gap-1 text-[10px] text-muted">
            <p className="flex items-center gap-1.5">
              <Rating value={product.rating} />
              <span aria-hidden="true">|</span>
              <span>{formatSold(product.soldCount)}</span>
            </p>
            <p className="flex items-center gap-1">
              <MapPin className="size-3" aria-hidden="true" />
              {product.city}
            </p>
          </div>
          {!wishlistMode && <AddToCartButton product={product} isLoggedIn={isLoggedIn} />}
        </div>

        {wishlistMode && (
          <WishlistCardActions
            wishlistState={wishlistState}
            showWishlistButton={showWishlistButton}
            outOfStock={outOfStock}
            onWishlistClick={onWishlistClick}
            onAddToCartClick={onAddToCartClick}
          />
        )}
      </div>
    </article>
  );
}
