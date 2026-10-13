import { proxyUpdateMyShop } from "@/features/shops/api/shop.server";

/** Saves the owner's shop information. The token comes from the httpOnly cookie. */
export async function PUT(request: Request) {
  return proxyUpdateMyShop(request);
}
