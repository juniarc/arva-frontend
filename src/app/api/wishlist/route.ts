import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addToWishlistOnBackend, readWishlistOnBackend } from "@/features/wishlist/api/wishlist.server";
import { addToWishlistRequestSchema } from "@/features/wishlist/schemas/wishlist.schema";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";

const LOGIN_AGAIN = { message: "Please log in again." };

/** Returns the user's wishlist. The token comes from the httpOnly cookie, never from browser JavaScript. */
export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json(LOGIN_AGAIN, { status: 401 });

  const result = await readWishlistOnBackend(token);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
  return NextResponse.json(result.wishlist);
}

/** Adds a product to the wishlist. */
export async function POST(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json(LOGIN_AGAIN, { status: 401 });

  const parsed = addToWishlistRequestSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a product to add." }, { status: 400 });
  }

  const result = await addToWishlistOnBackend(token, parsed.data.productId);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
  return NextResponse.json(result.wishlist);
}
