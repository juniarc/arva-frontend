import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { removeFromWishlistOnBackend } from "@/features/wishlist/api/wishlist.server";
import { removeFromWishlistRequestSchema } from "@/features/wishlist/schemas/wishlist.schema";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";

/** Removes wishlist entries. The token comes from the httpOnly cookie. */
export async function DELETE(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: "Please log in again." }, { status: 401 });

  const parsed = removeFromWishlistRequestSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ message: "Select between 1 and 100 items to remove." }, { status: 400 });
  }

  const result = await removeFromWishlistOnBackend(token, parsed.data.itemIds);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
  return NextResponse.json(result.wishlist);
}
