import { NextResponse } from "next/server";
import { getProductReviews } from "@/features/products/api/catalog.server";
import { REVIEWS_PAGE_SIZE } from "@/features/products/constants";

/** Lets the review list load more reviews without the browser calling the backend directly. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = Number(new URL(request.url).searchParams.get("page") ?? "1");

  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ message: "Invalid page." }, { status: 400 });
  }

  const result = await getProductReviews(slug, page, REVIEWS_PAGE_SIZE);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
  return NextResponse.json({ reviews: result.reviews, total: result.total });
}
