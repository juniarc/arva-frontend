import { formatCurrency } from "@/lib/format";
import type { Cart } from "./schemas/cart.schema";

/** One row in the cart drawer preview. */
export interface CartPreviewItem {
  id: string;
  name: string;
  imageUrl: string;
  variant: string;
  quantity: number;
  /** Already formatted, e.g. "Rp 1.000". */
  price: string;
}

export function toCartPreview(cart: Cart): CartPreviewItem[] {
  return cart.items.map((item) => ({
    id: item.id,
    name: item.product.name,
    imageUrl: item.product.imageUrl,
    variant: item.variant.label,
    quantity: item.quantity,
    price: formatCurrency(item.variant.price),
  }));
}
