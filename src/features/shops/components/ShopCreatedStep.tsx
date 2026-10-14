"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Category } from "@/features/products/types";
import { ProductForm } from "@/features/seller-products/components/ProductForm";

/** How long "Product uploaded." shows before the page goes to the new shop. */
export const AFTER_UPLOAD_DELAY_MS = 1_500;

interface ShopCreatedStepProps {
  shop: { slug: string; name: string };
  categories: Category[];
}

/**
 * Step 3, Upload Product. The shop already exists at this point. The seller lists a first product,
 * or skips this and goes to the shop.
 */
export function ShopCreatedStep({ shop, categories }: ShopCreatedStepProps) {
  const router = useRouter();
  const [uploaded, setUploaded] = useState(false);
  const shopHref = `/shops/${shop.slug}`;

  useEffect(() => {
    if (!uploaded) return;
    const timer = setTimeout(() => router.push(shopHref), AFTER_UPLOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [uploaded, router, shopHref]);

  return (
    <>
      <p className="mb-2 text-sm text-ink">
        Your shop <strong>{shop.name}</strong> is open. Add your first product.
      </p>
      <ProductForm
        categories={categories}
        labelledBy="create-shop-heading"
        secondaryLabel="Skip for now"
        onSecondary={() => router.push(shopHref)}
        onCreated={() => setUploaded(true)}
      />
    </>
  );
}
