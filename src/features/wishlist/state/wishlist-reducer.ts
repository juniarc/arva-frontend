import type { WishlistData, WishlistItem } from "../types";

export interface WishlistState {
  items: WishlistItem[];
  itemCount: number;
  /** The item removed on screen but not yet confirmed by the server, and where it was. Used to roll back. */
  pending: { item: WishlistItem; index: number } | null;
}

export type WishlistAction =
  /** The card disappears right away, before the server confirms. */
  | { type: "remove/optimistic"; id: string }
  /** The server refused: the card comes back at the same position. */
  | { type: "remove/rollback" }
  /** The server sent the full wishlist. It replaces ours. */
  | { type: "list/replace"; wishlist: WishlistData };

export function createInitialState(wishlist: WishlistData): WishlistState {
  return { items: wishlist.items, itemCount: wishlist.itemCount, pending: null };
}

export function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case "remove/optimistic": {
      const index = state.items.findIndex((item) => item.id === action.id);
      const item = state.items[index];
      if (index === -1 || !item) return state;
      return {
        items: state.items.filter((candidate) => candidate.id !== action.id),
        itemCount: Math.max(0, state.itemCount - 1),
        pending: { item, index },
      };
    }
    case "remove/rollback": {
      if (!state.pending) return state;
      const items = [...state.items];
      items.splice(state.pending.index, 0, state.pending.item);
      return { items, itemCount: state.itemCount + 1, pending: null };
    }
    case "list/replace":
      return createInitialState(action.wishlist);
  }
}
