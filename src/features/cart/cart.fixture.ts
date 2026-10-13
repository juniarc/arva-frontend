import type { CartData, CartItem } from "./types";

/** Test helpers. Build a cart item or a whole cart with sensible defaults. */
export function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "1",
    quantity: 2,
    productId: "p1",
    productSlug: "banana-bali",
    name: "Banana Fruit from Bali",
    imageUrl: "/images/dummy/placeholder.svg",
    shop: { key: "kebun-bali", name: "Kebun Bali" },
    variantLabel: "1 kg",
    unit: "kg",
    price: 2000,
    stock: 10,
    ...overrides,
  };
}

export function makeCart(items: CartItem[]): CartData {
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}
