import { describe, expect, it } from "vitest";
import { addressDto, makeDraft } from "../checkout.fixture";
import { checkoutReducer, createInitialState } from "./checkout-reducer";

const initial = createInitialState(makeDraft());

describe("checkoutReducer", () => {
  it("starts with no pending request and no error", () => {
    expect(initial.pending.size).toBe(0);
    expect(initial.error).toBeNull();
  });

  it("marks one request as pending, and clears an old error", () => {
    const failed = checkoutReducer(initial, { type: "request/failure", key: "damage", message: "Nope" });
    const started = checkoutReducer(failed, { type: "request/start", key: "shipping" });

    expect(started.pending.has("shipping")).toBe(true);
    expect(started.error).toBeNull();
  });

  it("replaces the whole draft on success, and clears the pending flag", () => {
    const started = checkoutReducer(initial, { type: "request/start", key: "address" });
    const server = makeDraft({
      address: addressDto,
      shipping: { id: 2, label: "JNE Reguler", estimate: "2 days", price: 12000 },
      summary: { productSubtotal: 1, shippingSubtotal: 2, buyerServiceFee: 3, handlingFee: 4, damageProtectionFee: 5, discount: 6, total: 7 },
    });

    const next = checkoutReducer(started, { type: "request/success", key: "address", draft: server });

    expect(next.draft).toBe(server);
    expect(next.draft.address?.label).toBe("Home");
    expect(next.draft.summary.total).toBe(7);
    expect(next.pending.size).toBe(0);
  });

  it("keeps the draft, clears the pending flag, and sets the message on failure", () => {
    const started = checkoutReducer(initial, { type: "request/start", key: "voucher" });
    const failed = checkoutReducer(started, { type: "request/failure", key: "voucher", message: "Could not update the voucher." });

    expect(failed.draft).toBe(initial.draft);
    expect(failed.pending.size).toBe(0);
    expect(failed.error).toBe("Could not update the voucher.");
  });

  it("only clears its own pending flag", () => {
    let state = checkoutReducer(initial, { type: "request/start", key: "damage" });
    state = checkoutReducer(state, { type: "request/start", key: "shipping" });
    state = checkoutReducer(state, { type: "request/end", key: "damage" });

    expect([...state.pending]).toEqual(["shipping"]);
  });

  it("shows a quantity at once, between 1 and the stock", () => {
    expect(checkoutReducer(initial, { type: "quantity/set", id: "7", quantity: 5 }).draft.items[0]?.quantity).toBe(5);
    expect(checkoutReducer(initial, { type: "quantity/set", id: "7", quantity: 0 }).draft.items[0]?.quantity).toBe(1);
    expect(checkoutReducer(initial, { type: "quantity/set", id: "7", quantity: 500 }).draft.items[0]?.quantity).toBe(10);
  });

  it("does not touch the summary when a quantity changes (the server reprices)", () => {
    const next = checkoutReducer(initial, { type: "quantity/set", id: "7", quantity: 5 });
    expect(next.draft.summary).toEqual(initial.draft.summary);
  });

  it("sets and dismisses the banner message", () => {
    const set = checkoutReducer(initial, { type: "error/set", message: "Oops" });
    expect(set.error).toBe("Oops");
    expect(checkoutReducer(set, { type: "error/dismiss" }).error).toBeNull();
  });
});
