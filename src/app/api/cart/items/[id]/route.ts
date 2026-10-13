import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { updateCartItemOnBackend } from "@/features/cart/api/cart.server";
import { updateQuantityRequestSchema } from "@/features/cart/schemas/cart.schema";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";

/** Sets one cart item's quantity. The token comes from the httpOnly cookie, never from browser JavaScript. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Please log in again." }, { status: 401 });
  }

  const parsed = updateQuantityRequestSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a quantity from 1 to 99." }, { status: 400 });
  }

  const { id } = await params;
  const result = await updateCartItemOnBackend(token, id, parsed.data.quantity);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
  return NextResponse.json(result.cart);
}
