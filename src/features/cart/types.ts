/** The shop an item belongs to. `key` is what items are grouped by. */
export interface CartShop {
  key: string;
  name: string;
}

/** One cart row, in the shape the UI uses. Built from the backend response by cart.mapper.ts. */
export interface CartItem {
  id: string;
  quantity: number;
  productId: string;
  productSlug: string;
  name: string;
  imageUrl: string;
  shop: CartShop;
  variantLabel: string;
  unit: string;
  /** Current unit price in IDR, from the backend. */
  price: number;
  stock: number;
}

export interface CartData {
  items: CartItem[];
  /** Total number of items, as reported by the backend. */
  itemCount: number;
  subtotal: number;
}

export interface ShopGroup {
  shop: CartShop;
  items: CartItem[];
}

/** "mixed" means some, but not all, items are selected. */
export type CheckState = "checked" | "unchecked" | "mixed";
