import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { removeCartItemsOnBackend } from "@/features/cart/api/cart.server";
import { removeItemsRequestSchema } from "@/features/cart/schemas/cart.schema";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";

/** Removes several cart items at once. The token comes from the httpOnly cookie. */
export async function DELETE(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Please log in again." }, { status: 401 });
  }

  const parsed = removeItemsRequestSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ message: "Select between 1 and 100 items to remove." }, { status: 400 });
  }

  const result = await removeCartItemsOnBackend(token, parsed.data.itemIds);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
  return NextResponse.json(result.cart);
}
