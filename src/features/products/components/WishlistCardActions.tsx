import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WishlistCardActionsProps {
  /** "in-wishlist" shows a filled red heart; "none" an empty one. */
  wishlistState: "none" | "in-wishlist";
  showWishlistButton: boolean;
  outOfStock: boolean;
  onWishlistClick?: () => void;
  onAddToCartClick?: () => void;
}

/**
 * Bottom row of a ProductCard in wishlist mode: the heart, and a wide Add To Cart button.
 * `relative z-10` lifts it above the card's stretched link, so both buttons are clickable.
 */
export function WishlistCardActions({
  wishlistState,
  showWishlistButton,
  outOfStock,
  onWishlistClick,
  onAddToCartClick,
}: WishlistCardActionsProps) {
  const inWishlist = wishlistState === "in-wishlist";

  return (
    <div className="relative z-10 mt-1 flex items-center gap-2">
      {showWishlistButton && (
        <button
          type="button"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={inWishlist}
          onClick={onWishlistClick}
          className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-danger bg-white text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info lg:size-8"
        >
          <Heart className={`size-4 ${inWishlist ? "fill-danger" : ""}`} aria-hidden="true" />
        </button>
      )}

      <Button
        variant="brand"
        className="min-w-0 flex-1 px-2 font-sans text-xs font-semibold lg:min-h-8"
        disabled={outOfStock}
        onClick={onAddToCartClick}
      >
        {!outOfStock && <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />}
        <span className="truncate">{outOfStock ? "Out of stock" : "Add To Cart"}</span>
      </Button>
    </div>
  );
}
