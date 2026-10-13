import { useId } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { shopCheckState, type SelectedIds } from "../state/cart-selection";
import type { ShopGroup as ShopGroupData } from "../types";
import { CartItemRow } from "./CartItemRow";

interface ShopGroupProps {
  group: ShopGroupData;
  selected: SelectedIds;
  updating: SelectedIds;
  wishlisted: ReadonlySet<string>;
  onToggleShop: (shopKey: string) => void;
  onToggleItem: (itemId: string) => void;
  onChangeQuantity: (itemId: string, quantity: number) => void;
  onToggleWishlist: (productId: string) => void;
}

/** A shop header with its checkbox, then that shop's items. The shop state is derived from the items. */
export function ShopGroup({
  group,
  selected,
  updating,
  wishlisted,
  onToggleShop,
  onToggleItem,
  onChangeQuantity,
  onToggleWishlist,
}: ShopGroupProps) {
  const headingId = useId();
  const state = shopCheckState(group, selected);
  const hasSelectableItems = group.items.some((item) => item.stock > 0);

  return (
    <section aria-labelledby={headingId} className="border-b border-line/40 py-1 last:border-b-0">
      <div className="flex items-center gap-2 lg:gap-3">
        <Checkbox
          label={`Select shop ${group.shop.name}`}
          checked={state === "checked"}
          indeterminate={state === "mixed"}
          disabled={!hasSelectableItems}
          onChange={() => onToggleShop(group.shop.key)}
          className="-ml-2 lg:ml-0"
        />
        <h2 id={headingId} className="text-sm font-bold">
          {group.shop.name}
        </h2>
      </div>

      <ul>
        {group.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            selected={selected.has(item.id)}
            updating={updating.has(item.id)}
            wishlisted={wishlisted.has(item.productId)}
            onToggleSelect={onToggleItem}
            onChangeQuantity={onChangeQuantity}
            onToggleWishlist={onToggleWishlist}
          />
        ))}
      </ul>
    </section>
  );
}
