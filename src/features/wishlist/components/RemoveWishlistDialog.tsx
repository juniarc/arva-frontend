"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/** "Remove 1 item from Wishlist ?" / "Remove 3 items from Wishlist ?" (the space before "?" is in the design). */
export function removeTitle(count: number): string {
  return `Remove ${count} ${count === 1 ? "item" : "items"} from Wishlist ?`;
}

interface RemoveWishlistDialogProps {
  open: boolean;
  /** Items about to be removed. Removal is one at a time today, so this is 1. */
  count: number;
  removing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * The wishlist's confirmation. The design swaps the usual button styles:
 * "Delete" is the outlined one and "Cancel" is the filled one. They are kept as designed.
 */
export function RemoveWishlistDialog({ open, count, removing, onConfirm, onClose }: RemoveWishlistDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title={removeTitle(count)}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      loading={removing}
      loadingLabel="Removing item"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
