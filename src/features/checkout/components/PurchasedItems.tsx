import { QuantityStepper } from "@/features/cart/components/QuantityStepper";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatCurrency } from "@/lib/format";
import { maxQuantity } from "../state/checkout-helpers";
import type { ShopGroup } from "../types";

interface PurchasedItemsProps {
  groups: ShopGroup[];
  onChangeQuantity: (itemId: string, quantity: number) => void;
}

/** The items, grouped by shop. The unit price is shown, as in the design; the totals are in the summary. */
export function PurchasedItems({ groups, onChangeQuantity }: PurchasedItemsProps) {
  return (
    <section aria-labelledby="purchased-items-title">
      <h2 id="purchased-items-title" className="font-serif text-xl font-bold md:text-2xl">
        Purchased Items
      </h2>

      {groups.map((group) => (
        <div key={group.shop.slug} className="mt-3">
          <p className="flex items-center gap-2 text-xs font-bold">
            {/* The backend sends no shop logo yet, so a green dot stands in. */}
            <span aria-hidden="true" className="size-5 rounded-full bg-brand" />
            {group.shop.name}
          </p>

          <ul>
            {group.items.map((item) => (
              <li key={item.id} className="flex gap-3 py-3">
                <div className="relative size-22 shrink-0 overflow-hidden rounded-md bg-surface md:size-28 lg:size-24">
                  <SafeImage src={item.imageUrl} alt="" fill sizes="7rem" className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="line-clamp-2 text-sm md:text-base lg:text-sm">{item.name}</p>
                  <p className="mt-1 text-xs text-muted md:text-sm lg:text-xs">{item.variantLabel}</p>
                  <p className="mt-1 text-base font-bold md:text-lg lg:text-base">{formatCurrency(item.price)}</p>
                  <div className="mt-2 flex justify-end">
                    <QuantityStepper
                      value={item.quantity}
                      max={maxQuantity(item)}
                      onChange={(next) => onChangeQuantity(item.id, next)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
