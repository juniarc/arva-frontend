import type { CartItem, CheckState, ShopGroup } from "../types";

/** Pure helpers for cart selection and totals. A selection is a set of cart item ids. */

export type SelectedIds = ReadonlySet<string>;

export const MAX_QUANTITY = 99;

/** Items without stock cannot be selected or bought. */
export function isSelectable(item: CartItem): boolean {
  return item.stock > 0;
}

export function maxQuantity(item: CartItem): number {
  return Math.min(item.stock, MAX_QUANTITY);
}

/** Keeps a quantity between 1 and the item's maximum. */
export function clampQuantity(item: CartItem, quantity: number): number {
  return Math.max(1, Math.min(quantity, maxQuantity(item)));
}

/** Groups items by shop, keeping the order in which each shop first appears. */
export function groupByShop(items: readonly CartItem[]): ShopGroup[] {
  const groups = new Map<string, ShopGroup>();
  for (const item of items) {
    const group = groups.get(item.shop.key);
    if (group) group.items.push(item);
    else groups.set(item.shop.key, { shop: item.shop, items: [item] });
  }
  return [...groups.values()];
}

export function selectedItems(items: readonly CartItem[], selected: SelectedIds): CartItem[] {
  return items.filter((item) => selected.has(item.id));
}

export function selectedCount(items: readonly CartItem[], selected: SelectedIds): number {
  return selectedItems(items, selected).length;
}

/** Sum of unit price times quantity for the selected items, in IDR. 0 when nothing is selected. */
export function selectedTotal(items: readonly CartItem[], selected: SelectedIds): number {
  return selectedItems(items, selected).reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/** Derived from the items, never stored. Items that cannot be selected are ignored. */
export function shopCheckState(group: ShopGroup, selected: SelectedIds): CheckState {
  const selectable = group.items.filter(isSelectable);
  const count = selectable.filter((item) => selected.has(item.id)).length;
  if (count === 0) return "unchecked";
  return count === selectable.length ? "checked" : "mixed";
}

/** True when there is at least one selectable item and all of them are selected. */
export function isAllSelected(items: readonly CartItem[], selected: SelectedIds): boolean {
  const selectable = items.filter(isSelectable);
  return selectable.length > 0 && selectable.every((item) => selected.has(item.id));
}

export function toggleItem(selected: SelectedIds, item: CartItem): Set<string> {
  const next = new Set(selected);
  if (!isSelectable(item)) return next;
  if (next.has(item.id)) next.delete(item.id);
  else next.add(item.id);
  return next;
}

/** Selects every selectable item of the shop, or deselects them all when they are already selected. */
export function toggleShop(selected: SelectedIds, group: ShopGroup): Set<string> {
  const next = new Set(selected);
  const selectable = group.items.filter(isSelectable);
  if (shopCheckState(group, selected) === "checked") {
    for (const item of selectable) next.delete(item.id);
  } else {
    for (const item of selectable) next.add(item.id);
  }
  return next;
}

export function toggleAll(items: readonly CartItem[], selected: SelectedIds): Set<string> {
  if (isAllSelected(items, selected)) return new Set();
  return new Set(items.filter(isSelectable).map((item) => item.id));
}

/** Drops ids that are no longer in the cart or can no longer be selected. */
export function pruneSelection(items: readonly CartItem[], selected: SelectedIds): Set<string> {
  const valid = new Set(items.filter(isSelectable).map((item) => item.id));
  return new Set([...selected].filter((id) => valid.has(id)));
}

export function canBuy(count: number): boolean {
  return count > 0;
}
