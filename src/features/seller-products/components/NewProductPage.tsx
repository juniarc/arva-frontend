"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Category } from "@/features/products/types";
import { BackButton } from "@/features/products/components/BackButton";
import { ProductForm } from "./ProductForm";

/** How long "Product uploaded." shows before the page goes back to the shop. */
export const AFTER_UPLOAD_DELAY_MS = 1_500;

interface NewProductPageProps {
  shopSlug: string;
  categories: Category[];
}

/** "/my-shop/products/new": the owner lists a product in their shop, then goes back to it. */
export function NewProductPage({ shopSlug, categories }: NewProductPageProps) {
  const router = useRouter();
  const [uploaded, setUploaded] = useState(false);
  const shopHref = `/shops/${shopSlug}`;

  useEffect(() => {
    if (!uploaded) return;
    const timer = setTimeout(() => router.push(shopHref), AFTER_UPLOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [uploaded, router, shopHref]);

  return (
    <>
      <div className="flex items-center px-2 py-1 lg:hidden">
        <BackButton className="bg-transparent shadow-none" />
      </div>
      <div className="mx-auto max-w-300 px-4 pb-10 pt-2 lg:px-6 lg:pt-8">
        <h1 id="new-product-heading" className="mb-4 text-center font-serif text-xl font-bold text-ink lg:mb-6 lg:text-left lg:text-3xl">
          Upload Product
        </h1>
        <ProductForm
          categories={categories}
          labelledBy="new-product-heading"
          secondaryLabel="Cancel"
          onSecondary={() => router.push(shopHref)}
          onCreated={() => setUploaded(true)}
        />
      </div>
    </>
  );
}
