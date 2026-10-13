import type { OwnerShopProduct } from "../types";
import { OwnerProductRow } from "./OwnerProductRow";

/** The owner's products, one row each (not a grid), in a white card with a border. Inactive products are included. */
export function OwnerProductList({ items }: { items: OwnerShopProduct[] }) {
  return (
    <ul className="rounded-md border border-line/30 bg-white px-4 shadow-sm lg:px-6">
      {items.map((item) => (
        <OwnerProductRow key={item.product.id} item={item} />
      ))}
    </ul>
  );
}
