import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addToCartOnBackend } from "@/features/cart/api/cart.server";
import { addToCartRequestSchema } from "@/features/cart/schemas/cart.schema";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";

/** Adds a variant to the cart. The token comes from the httpOnly cookie, never from the browser's JavaScript. */
export async function POST(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Please log in to add items to your cart." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => undefined);
  const parsed = addToCartRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a variant and a quantity from 1 to 99." }, { status: 400 });
  }

  const result = await addToCartOnBackend(token, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json({ itemCount: result.cart.itemCount });
}
