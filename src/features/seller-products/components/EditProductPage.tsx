"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/features/products/components/BackButton";
import type { Category } from "@/features/products/types";
import type { OwnedProduct } from "../mappers/product-form.mapper";
import { ProductForm } from "./ProductForm";

/** How long "Product updated." shows before the page goes back to the shop. */
export const AFTER_SAVE_DELAY_MS = 1_500;

interface EditProductPageProps {
  shopSlug: string;
  product: OwnedProduct;
  categories: Category[];
}

/** "/my-shop/products/[id]/edit": the upload form, filled in with the product. Cancel and Edit, as in the design. */
export function EditProductPage({ shopSlug, product, categories }: EditProductPageProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const shopHref = `/shops/${shopSlug}`;

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => router.push(shopHref), AFTER_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [saved, router, shopHref]);

  return (
    <>
      <div className="flex items-center px-2 py-1 lg:hidden">
        <BackButton className="bg-transparent shadow-none" />
      </div>
      <div className="mx-auto max-w-300 px-4 pb-10 pt-2 lg:px-6 lg:pt-8">
        <h1 id="edit-product-heading" className="mb-4 text-center font-serif text-xl font-bold text-ink lg:mb-6 lg:text-left lg:text-3xl">
          Edit Product
        </h1>
        <ProductForm
          mode={{ kind: "edit", productId: product.id, values: product.values, photos: product.photos }}
          categories={categories}
          labelledBy="edit-product-heading"
          secondaryLabel="Cancel"
          onSecondary={() => router.push(shopHref)}
          onCreated={() => setSaved(true)}
        />
      </div>
    </>
  );
}
