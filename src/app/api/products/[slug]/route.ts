import { NextResponse } from "next/server";
import { getProductDetail } from "@/features/products/api/catalog.server";

/** Lets the add-to-cart modal load a product's variants without the browser calling the backend directly. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getProductDetail(slug);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
  return NextResponse.json({ product: result.product });
}
