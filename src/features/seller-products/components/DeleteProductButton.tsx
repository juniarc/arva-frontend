"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteProduct } from "../api/product.client";

export const DELETE_QUESTION = "Are you sure you want to delete this product?";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

/**
 * The red trash button on an owner's product row. It asks first (as in the design), then removes the
 * product completely and reloads the shop page, so the list is fresh.
 */
export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setDeleting(true);
    const result = await deleteProduct(productId);
    setDeleting(false);
    setOpen(false);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(result.message);
  };

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label={`Delete ${productName}`}
        className="inline-flex min-h-11 items-center justify-center rounded-sm border border-danger px-4 text-danger focus-visible:outline-2 focus-visible:outline-info lg:min-h-8"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
      {error && (
        <p role="alert" className="mt-1 max-w-48 text-right text-xs text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={open}
        title={DELETE_QUESTION}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        loadingLabel="Deleting"
        onConfirm={() => void confirm()}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
