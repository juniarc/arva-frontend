import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductDetail } from "@/features/products/components/ProductDetail";
import { getProductPage } from "@/features/products/data/product.loader";
import { isLoggedIn } from "@/lib/session";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// generateMetadata and the page both need the data, so share one load per request.
const loadProductPage = cache(getProductPage);

function firstSentence(text: string): string {
  const match = text.trim().match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadProductPage(slug);
  if (!data) return { title: "Product not found" };

  const { product } = data;
  return {
    title: { absolute: `${product.name} | Arva` },
    description: product.description
      ? firstSentence(product.description)
      : `Buy ${product.name} from ${product.shop.name} on Arva.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [data, loggedIn] = await Promise.all([loadProductPage(slug), isLoggedIn()]);
  if (!data) notFound();

  return <ProductDetail data={data} isLoggedIn={loggedIn} />;
}
