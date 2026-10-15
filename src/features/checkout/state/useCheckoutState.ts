"use client";

import { useRouter } from "next/navigation";
import { useReducer, useRef, useState } from "react";
import { useQuantityUpdates } from "@/features/cart/state/useQuantityUpdates";
import {
  getDraft,
  placeOrder,
  saveAddress,
  selectPaymentMethod,
  selectShipping,
  selectVoucher,
  setDamageProtection,
  type ApiResult,
} from "../api/checkout.client";
import type { AddressInput } from "../schemas/address.schema";
import type { Draft } from "../types";
import { canPlaceOrder, groupItemsByShop, payNowHint } from "./checkout-helpers";
import { checkoutReducer, createInitialState, type PendingKey } from "./checkout-reducer";

const ORDER_FAILED = "Could not place your order. Please try again.";
const QUANTITY_FAILED = "Could not update the quantity. Please try again.";

/**
 * Owns everything the checkout page changes. After every call that returns a draft, the draft is
 * replaced as a whole. The client never adds or subtracts money: all amounts come from `draft.summary`.
 */
export function useCheckoutState(initialDraft: Draft) {
  const router = useRouter();
  const [state, dispatch] = useReducer(checkoutReducer, initialDraft, createInitialState);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const { draft } = state;

  const draftRef = useRef(draft);
  draftRef.current = draft;

  /** Runs a button's request. The draft is replaced on success; the banner shows the message on failure. */
  const run = async (key: PendingKey, call: () => Promise<ApiResult<Draft>>) => {
    dispatch({ type: "request/start", key });
    const result = await call();
    if (result.ok) dispatch({ type: "request/success", key, draft: result.data });
    else dispatch({ type: "request/failure", key, message: result.message });
  };

  /** Saves the draft's address. The modal shows the error itself, so the banner is not used. */
  const saveDraftAddress = async (address: AddressInput): Promise<{ ok: true } | { ok: false; message: string }> => {
    dispatch({ type: "request/start", key: "address" });
    const result = await saveAddress(address);
    if (!result.ok) {
      dispatch({ type: "request/end", key: "address" });
      return { ok: false, message: result.message };
    }
    dispatch({ type: "request/success", key: "address", draft: result.data });
    return { ok: true };
  };

  // Quantities live in the cart. After they settle, the draft is loaded again so it is repriced.
  const quantityUpdates = useQuantityUpdates({
    getQuantity: (itemId) => draftRef.current.items.find((item) => item.id === itemId)?.quantity,
    onOptimistic: (id, quantity) => dispatch({ type: "quantity/set", id, quantity }),
    onRollback: (id, quantity) => dispatch({ type: "quantity/set", id, quantity }),
    onServerCart: () => {
      void getDraft().then((result) => {
        if (result.ok) {
          dispatch({ type: "draft/replace", draft: result.data });
          router.refresh(); // the header cart badge
        } else {
          dispatch({ type: "error/set", message: QUANTITY_FAILED });
        }
      });
    },
    onError: (message) => dispatch({ type: "error/set", message }),
  });

  const changeQuantity = (itemId: string, quantity: number) => {
    const item = draft.items.find((candidate) => candidate.id === itemId);
    if (!item || quantity === item.quantity || quantity < 1) return;
    dispatch({ type: "error/dismiss" });
    quantityUpdates.change(itemId, item.quantity, quantity);
  };

  const pay = async () => {
    if (!canPlaceOrder(draft) || state.pending.has("order")) return;

    dispatch({ type: "request/start", key: "order" });
    // Quantities the user just chose must reach the server before the order is placed.
    await quantityUpdates.flushAll();
    const result = await placeOrder();

    if (result.ok) {
      dispatch({ type: "request/end", key: "order" });
      setOrderCode(result.data.code);
      return;
    }
    // A refused order (400, 409) says why, for example "Only 2 left of Banana.". The client never keeps a 5xx message.
    const reason = result.status === 400 || result.status === 409 ? result.message : ORDER_FAILED;
    dispatch({ type: "request/failure", key: "order", message: reason });
  };

  return {
    draft,
    groups: groupItemsByShop(draft.items),
    pending: state.pending,
    error: state.error,
    dismissError: () => dispatch({ type: "error/dismiss" }),
    orderCode,
    canPay: canPlaceOrder(draft),
    payHint: payNowHint(draft),
    saveAddress: saveDraftAddress,
    setDamageProtection: (enabled: boolean) => run("damage", () => setDamageProtection(enabled)),
    selectShipping: (optionId: string) => run("shipping", () => selectShipping(optionId)),
    selectVoucher: (voucherId: string | null) => run("voucher", () => selectVoucher(voucherId)),
    selectPaymentMethod: (methodId: string) => run("payment", () => selectPaymentMethod(methodId)),
    changeQuantity,
    pay,
  };
}
