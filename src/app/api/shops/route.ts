import { proxyCreateShop } from "@/features/shops/api/shop.server";

/** Opens the user's shop. The token comes from the httpOnly cookie. */
export async function POST(request: Request) {
  return proxyCreateShop(request);
}
