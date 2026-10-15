import { z } from "zod";
import { cartSchema } from "@/features/cart/schemas/cart.schema";
import type { Profile } from "@/features/profile/types";
import type { MyShop, Shop } from "@/features/shops/types";
import { formatCurrency } from "@/lib/format";
import type { NavbarCart, NavbarShop, NavbarUser } from "./navbar.types";

/** How many cart items the desktop dropdown shows. */
export const CART_PREVIEW_LIMIT = 3;
/** The shop trigger shows at most this many characters of the shop name. */
export const SHOP_NAME_LIMIT = 14;

const meSchema = z.object({ user: z.object({ username: z.string().min(1), email: z.string() }) });

/** GET /auth/me. Null for a wrong shape. Extra fields are ignored. */
export function parseMe(data: unknown): { username: string; email: string } | null {
  const result = meSchema.safeParse(data);
  return result.success ? result.data.user : null;
}

/** The user from /auth/me and /profile. The profile's username and email win; its photo is the avatar. */
export function toNavbarUser(me: { username: string; email: string } | null, profile: Profile | null): NavbarUser {
  return {
    username: profile?.user.username || me?.username || null,
    email: profile?.user.email || me?.email || null,
    photoUrl: profile?.user.photoUrl ?? null,
  };
}

/** GET /cart. Null for a wrong shape. Extra fields are ignored. */
export function parseNavbarCart(data: unknown): NavbarCart | null {
  const result = cartSchema.safeParse(data);
  if (!result.success) return null;
  return {
    itemCount: result.data.itemCount,
    items: result.data.items.map((item) => ({
      id: item.id,
      name: item.product.name,
      imageUrl: item.product.imageUrl,
      variantLabel: item.variant.label,
      unitPrice: item.variant.price,
      quantity: item.quantity,
    })),
  };
}

/**
 * The shop from GET /shops/me and GET /shops/:slug. The public response has the city and rating that
 * /shops/me does not; when it is missing, the name and logo from /shops/me are used and the rest is empty.
 */
export function toNavbarShop(mine: MyShop, publicShop: Shop | null): NavbarShop {
  return {
    status: "shop",
    slug: mine.slug,
    name: publicShop?.name ?? mine.name,
    logoUrl: publicShop?.logoUrl ?? mine.logoUrl,
    city: publicShop?.city ?? null,
    rating: publicShop ? publicShop.rating : null,
  };
}

/** "Bali Fresh Farm Organic" becomes "Bali Fresh Far…". */
export function truncateName(name: string, limit: number = SHOP_NAME_LIMIT): string {
  return name.length > limit ? `${name.slice(0, limit).trimEnd()}…` : name;
}

/** "2 x Rp 1.000": the quantity and the price of one unit. */
export function linePrice(quantity: number, unitPrice: number): string {
  return `${quantity} x ${formatCurrency(unitPrice)}`;
}
