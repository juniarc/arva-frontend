import type { Draft } from "../types";
import { maxQuantity } from "./checkout-helpers";

/** Things that can be waiting for the server. Each one disables only its own control. */
export type PendingKey = "address" | "damage" | "shipping" | "voucher" | "payment" | "order";

export interface CheckoutState {
  draft: Draft;
  pending: ReadonlySet<PendingKey>;
  /** Text for the error banner, or null. */
  error: string | null;
}

export type CheckoutAction =
  | { type: "request/start"; key: PendingKey }
  /** The server answered with the new draft. It replaces ours as a whole: nothing is merged. */
  | { type: "request/success"; key: PendingKey; draft: Draft }
  | { type: "request/failure"; key: PendingKey; message: string }
  /** The request ended and there is nothing to show in the banner (the caller shows its own message). */
  | { type: "request/end"; key: PendingKey }
  /** A new draft that did not come from a button (for example after a quantity change). */
  | { type: "draft/replace"; draft: Draft }
  /** Shows a quantity right away, before the server confirms it. Also used to roll it back. */
  | { type: "quantity/set"; id: string; quantity: number }
  | { type: "error/set"; message: string }
  | { type: "error/dismiss" };

export function createInitialState(draft: Draft): CheckoutState {
  return { draft, pending: new Set(), error: null };
}

function without(pending: ReadonlySet<PendingKey>, key: PendingKey): Set<PendingKey> {
  const next = new Set(pending);
  next.delete(key);
  return next;
}

export function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case "request/start":
      return { ...state, pending: new Set(state.pending).add(action.key), error: null };
    case "request/success":
      return { draft: action.draft, pending: without(state.pending, action.key), error: null };
    case "request/failure":
      return { ...state, pending: without(state.pending, action.key), error: action.message };
    case "request/end":
      return { ...state, pending: without(state.pending, action.key) };
    case "draft/replace":
      return { ...state, draft: action.draft };
    case "quantity/set": {
      const items = state.draft.items.map((item) =>
        item.id === action.id ? { ...item, quantity: Math.max(1, Math.min(action.quantity, maxQuantity(item))) } : item,
      );
      return { ...state, draft: { ...state.draft, items } };
    }
    case "error/set":
      return { ...state, error: action.message };
    case "error/dismiss":
      return { ...state, error: null };
  }
}
