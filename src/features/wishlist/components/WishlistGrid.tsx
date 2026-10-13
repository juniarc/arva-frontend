"use client";

import { ProductCard } from "@/features/products/components/ProductCard";
import type { Product } from "@/features/products/types";
import type { WishlistItem } from "../types";

interface WishlistGridProps {
  items: WishlistItem[];
  /** Tapping the heart: the page asks for confirmation. */
  onRemove: (itemId: string) => void;
  onAddToCart: (product: Product) => void;
}

/** 2 columns on mobile, 3 on tablet, 5 on desktop. Every card is a ProductCard in wishlist mode. */
export function WishlistGrid({ items, onRemove, onAddToCart }: WishlistGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
      {items.map((item) => (
        <li key={item.id}>
          <ProductCard
            product={item.product}
            wishlistState="in-wishlist"
            outOfStock={!item.isAvailable}
            onWishlistClick={() => onRemove(item.id)}
            onAddToCartClick={() => onAddToCart(item.product)}
          />
        </li>
      ))}
    </ul>
  );
}
