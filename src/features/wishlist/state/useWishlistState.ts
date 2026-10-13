"use client";

import { useEffect, useReducer, useState } from "react";
import { removeFromWishlist } from "../api/wishlist.client";
import type { WishlistData } from "../types";
import { createInitialState, wishlistReducer } from "./wishlist-reducer";

export interface WishlistNotice {
  variant: "success" | "error";
  message: string;
}

/** The success message hides itself after this long. */
const SUCCESS_NOTICE_MS = 4_000;

/**
 * Owns what the wishlist page changes: the list, and the remove-with-confirmation flow.
 * Removal is optimistic: the card disappears when the user confirms, and comes back if the server says no.
 */
export function useWishlistState(initial: WishlistData) {
  const [state, dispatch] = useReducer(wishlistReducer, initial, createInitialState);
  /** The wishlist entry the dialog is asking about. The dialog is open while this is set. */
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [notice, setNotice] = useState<WishlistNotice | null>(null);

  useEffect(() => {
    if (notice?.variant !== "success") return;
    const timer = setTimeout(() => setNotice(null), SUCCESS_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  /** The heart was tapped: ask first. */
  const requestRemove = (itemId: string) => {
    if (removing) return;
    setNotice(null);
    setConfirmId(itemId);
  };

  const cancelRemove = () => {
    if (!removing) setConfirmId(null);
  };

  const confirmRemove = async () => {
    if (confirmId === null || removing) return;
    const itemId = confirmId;

    setRemoving(true);
    dispatch({ type: "remove/optimistic", id: itemId });
    const result = await removeFromWishlist([itemId]);

    if (result.ok) {
      dispatch({ type: "list/replace", wishlist: result.wishlist });
      setNotice({ variant: "success", message: "Wishlist Successfully Removed." });
    } else {
      dispatch({ type: "remove/rollback" });
      setNotice({ variant: "error", message: result.message });
    }
    setRemoving(false);
    setConfirmId(null);
  };

  return {
    items: state.items,
    itemCount: state.itemCount,
    notice,
    dismissNotice: () => setNotice(null),
    dialogOpen: confirmId !== null,
    removing,
    requestRemove,
    cancelRemove,
    confirmRemove,
  };
}
