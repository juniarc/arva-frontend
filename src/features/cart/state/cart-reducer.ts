import type { CartData } from "../types";
import {
  clampQuantity,
  groupByShop,
  pruneSelection,
  toggleAll,
  toggleItem,
  toggleShop,
  type SelectedIds,
} from "./cart-selection";

export interface CartState {
  cart: CartData;
  selected: SelectedIds;
  /** Items being removed. Their stepper is disabled until the server answers. Quantity changes never block. */
  updating: SelectedIds;
}

export type CartAction =
  | { type: "item/toggle"; id: string }
  | { type: "shop/toggle"; shopKey: string }
  | { type: "all/toggle" }
  /** Shows the new quantity right away, before the server confirms it. */
  | { type: "quantity/optimistic"; id: string; quantity: number }
  /** A removal request for this item is running. */
  | { type: "updating/start"; id: string }
  | { type: "updating/end"; id: string }
  /** The update failed: put the previous quantity back. */
  | { type: "quantity/rollback"; id: string; quantity: number }
  /** The server sent the full cart. It replaces ours, and the selection is trimmed to what still exists. */
  | { type: "cart/replace"; cart: CartData };

export function createInitialState(cart: CartData): CartState {
  return { cart, selected: new Set(), updating: new Set() };
}

function withQuantity(state: CartState, id: string, quantity: number): CartState {
  const items = state.cart.items.map((item) =>
    item.id === id ? { ...item, quantity: clampQuantity(item, quantity) } : item,
  );
  return { ...state, cart: { ...state.cart, items } };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  const { items } = state.cart;

  switch (action.type) {
    case "item/toggle": {
      const item = items.find((candidate) => candidate.id === action.id);
      return item ? { ...state, selected: toggleItem(state.selected, item) } : state;
    }
    case "shop/toggle": {
      const group = groupByShop(items).find((candidate) => candidate.shop.key === action.shopKey);
      return group ? { ...state, selected: toggleShop(state.selected, group) } : state;
    }
    case "all/toggle":
      return { ...state, selected: toggleAll(items, state.selected) };
    case "quantity/optimistic":
      return withQuantity(state, action.id, action.quantity);
    case "quantity/rollback":
      return withQuantity(state, action.id, action.quantity);
    case "updating/start":
      return { ...state, updating: new Set(state.updating).add(action.id) };
    case "updating/end": {
      const updating = new Set(state.updating);
      updating.delete(action.id);
      return { ...state, updating };
    }
    case "cart/replace":
      return {
        cart: action.cart,
        selected: pruneSelection(action.cart.items, state.selected),
        updating: new Set(),
      };
  }
}
