"use client";

import { useRouter } from "next/navigation";
import { useMemo, useReducer, useRef, useState } from "react";
import { buyNow, removeItems } from "../api/cart.client";
import { toggleWishlist } from "../wishlist";
import type { CartData } from "../types";
import { cartReducer, createInitialState } from "./cart-reducer";
import { canBuy, clampQuantity, groupByShop, isAllSelected, selectedCount, selectedTotal } from "./cart-selection";
import { useQuantityUpdates } from "./useQuantityUpdates";

export interface CartNotice {
  variant: "success" | "error";
  message: string;
}

/**
 * Owns everything the cart page changes: selection, quantities, clearing and buying.
 * Quantity changes are optimistic and batched (see useQuantityUpdates). Removals wait for the server.
 * The server's cart is the source of truth: once everything has settled, its answer replaces ours.
 */
export function useCartState(initialCart: CartData, initialNotice: CartNotice | null = null) {
  const router = useRouter();
  const [state, dispatch] = useReducer(cartReducer, initialCart, createInitialState);
  const [notice, setNotice] = useState<CartNotice | null>(initialNotice);
  const [clearing, setClearing] = useState(false);
  const [wishlisted, setWishlisted] = useState<ReadonlySet<string>>(new Set());

  const { items } = state.cart;
  const groups = useMemo(() => groupByShop(items), [items]);
  const count = selectedCount(items, state.selected);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const quantityUpdates = useQuantityUpdates({
    getQuantity: (itemId) => itemsRef.current.find((item) => item.id === itemId)?.quantity,
    onOptimistic: (id, quantity) => dispatch({ type: "quantity/optimistic", id, quantity }),
    onRollback: (id, quantity) => dispatch({ type: "quantity/rollback", id, quantity }),
    onServerCart: (cart) => {
      dispatch({ type: "cart/replace", cart });
      router.refresh(); // updates the header cart badge, once per burst of clicks
    },
    onError: (message) => setNotice({ variant: "error", message }),
  });

  /** Calls DELETE for the given items. Nothing changes on screen until the server confirms. */
  const removeByIds = async (ids: string[]) => {
    setNotice(null);
    // Send waiting quantity changes first, so the server's answer does not undo them.
    await quantityUpdates.flushAll(new Set(ids));
    const result = await removeItems(ids);

    if (!result.ok) {
      setNotice({ variant: "error", message: result.message });
      return false;
    }
    dispatch({ type: "cart/replace", cart: result.cart });
    setNotice({ variant: "success", message: "Items removed from cart." });
    router.refresh();
    return true;
  };

  const changeQuantity = async (itemId: string, quantity: number) => {
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item || state.updating.has(itemId) || quantity === item.quantity) return;

    // "-" at quantity 1 asks for 0, which removes the item.
    if (quantity < 1) {
      dispatch({ type: "updating/start", id: itemId });
      const removed = await removeByIds([itemId]);
      if (!removed) dispatch({ type: "updating/end", id: itemId });
      return;
    }

    setNotice(null);
    quantityUpdates.change(itemId, item.quantity, clampQuantity(item, quantity));
  };

  /** Removes the selected items. Nothing changes on screen until the server confirms. */
  const clearSelected = async () => {
    const ids = items.filter((item) => state.selected.has(item.id)).map((item) => item.id);
    if (ids.length === 0 || clearing) return;

    setClearing(true);
    await removeByIds(ids);
    setClearing(false);
  };

  const buy = async () => {
    if (!canBuy(count)) return;
    setNotice(null);
    const result = await buyNow([...state.selected]);
    if (result.ok) {
      router.push("/checkout");
      return;
    }
    setNotice({ variant: "error", message: result.message });
  };

  return {
    items,
    groups,
    itemCount: state.cart.itemCount,
    selected: state.selected,
    updating: state.updating,
    selectedCount: count,
    total: selectedTotal(items, state.selected),
    allSelected: isAllSelected(items, state.selected),
    canBuy: canBuy(count),
    wishlisted,
    notice,
    clearing,
    dismissNotice: () => setNotice(null),
    toggleItem: (id: string) => dispatch({ type: "item/toggle", id }),
    toggleShop: (shopKey: string) => dispatch({ type: "shop/toggle", shopKey }),
    toggleAll: () => dispatch({ type: "all/toggle" }),
    toggleWishlist: (productId: string) => setWishlisted((current) => toggleWishlist(current, productId)),
    changeQuantity,
    clearSelected,
    buy,
  };
}
