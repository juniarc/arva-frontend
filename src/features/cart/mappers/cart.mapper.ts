import { cartSchema, type Cart } from "../schemas/cart.schema";
import type { CartData, CartItem } from "../types";

/** The backend sent something the cart page cannot use. */
export class CartMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CartMappingError";
  }
}

type CartDtoItem = Cart["items"][number];

function toItem(dto: CartDtoItem): CartItem {
  return {
    id: dto.id,
    quantity: dto.quantity,
    productId: dto.product.id,
    productSlug: dto.product.slug,
    name: dto.product.name,
    imageUrl: dto.product.imageUrl,
    shop: { key: dto.product.shop.slug, name: dto.product.shop.name },
    variantLabel: dto.variant.label,
    unit: dto.variant.unit,
    price: dto.variant.price,
    stock: dto.variant.stock,
  };
}

export function toCartData(dto: Cart): CartData {
  return { items: dto.items.map(toItem), itemCount: dto.itemCount, subtotal: dto.subtotal };
}

/** Validates an unknown response body and maps it. Throws CartMappingError when the shape is wrong. */
export function parseCart(data: unknown): CartData {
  const parsed = cartSchema.safeParse(data);
  if (!parsed.success) throw new CartMappingError("Unexpected cart response shape.");
  return toCartData(parsed.data);
}
