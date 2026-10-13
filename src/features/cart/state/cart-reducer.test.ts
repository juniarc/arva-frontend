import { describe, expect, it } from "vitest";
import { makeCart, makeCartItem } from "../cart.fixture";
import { cartReducer, createInitialState } from "./cart-reducer";

const a1 = makeCartItem({ id: "a1", quantity: 2, stock: 5 });
const a2 = makeCartItem({ id: "a2" });
const b1 = makeCartItem({ id: "b1", shop: { key: "tani", name: "Tani" } });
const initial = createInitialState(makeCart([a1, a2, b1]));

describe("cartReducer selection", () => {
  it("starts with nothing selected", () => {
    expect(initial.selected.size).toBe(0);
  });

  it("toggles an item, a shop, and all", () => {
    const withItem = cartReducer(initial, { type: "item/toggle", id: "a1" });
    expect([...withItem.selected]).toEqual(["a1"]);

    const withShop = cartReducer(withItem, { type: "shop/toggle", shopKey: "kebun-bali" });
    expect([...withShop.selected].sort()).toEqual(["a1", "a2"]);

    const withAll = cartReducer(withShop, { type: "all/toggle" });
    expect(withAll.selected.size).toBe(3);
    expect(cartReducer(withAll, { type: "all/toggle" }).selected.size).toBe(0);
  });
});

describe("cartReducer quantity", () => {
  it("shows the new quantity at once without blocking the stepper", () => {
    const next = cartReducer(initial, { type: "quantity/optimistic", id: "a1", quantity: 3 });
    expect(next.cart.items[0]?.quantity).toBe(3);
    expect(next.updating.size).toBe(0);
  });

  it("clamps to 1 and to the stock", () => {
    const low = cartReducer(initial, { type: "quantity/optimistic", id: "a1", quantity: 0 });
    expect(low.cart.items[0]?.quantity).toBe(1);

    const high = cartReducer(initial, { type: "quantity/optimistic", id: "a1", quantity: 50 });
    expect(high.cart.items[0]?.quantity).toBe(5);
  });

  it("rolls back to the previous quantity", () => {
    const optimistic = cartReducer(initial, { type: "quantity/optimistic", id: "a1", quantity: 3 });
    const rolledBack = cartReducer(optimistic, { type: "quantity/rollback", id: "a1", quantity: 2 });
    expect(rolledBack.cart.items[0]?.quantity).toBe(2);
    expect(rolledBack.updating.size).toBe(0);
  });
});

describe("cartReducer updating markers", () => {
  it("marks an item as updating and clears it again", () => {
    const started = cartReducer(initial, { type: "updating/start", id: "a1" });
    expect(started.updating.has("a1")).toBe(true);
    expect(cartReducer(started, { type: "updating/end", id: "a1" }).updating.size).toBe(0);
  });
});

describe("cartReducer cart/replace", () => {
  it("removes only the selected items and clears their selection", () => {
    const selected = cartReducer(
      cartReducer(initial, { type: "item/toggle", id: "a1" }),
      { type: "item/toggle", id: "b1" },
    );

    // The server answers with the cart after removing a1 and b1.
    const after = cartReducer(selected, { type: "cart/replace", cart: makeCart([a2]) });

    expect(after.cart.items.map((item) => item.id)).toEqual(["a2"]);
    expect(after.selected.size).toBe(0);
  });

  it("keeps the selection of items that are still in the cart", () => {
    const selected = cartReducer(initial, { type: "item/toggle", id: "a2" });
    const after = cartReducer(selected, { type: "cart/replace", cart: makeCart([a2, b1]) });
    expect([...after.selected]).toEqual(["a2"]);
  });

  it("uses the server's quantities, not ours", () => {
    const optimistic = cartReducer(initial, { type: "quantity/optimistic", id: "a1", quantity: 4 });
    const after = cartReducer(optimistic, {
      type: "cart/replace",
      cart: makeCart([makeCartItem({ id: "a1", quantity: 3, stock: 5 }), a2, b1]),
    });
    expect(after.cart.items[0]?.quantity).toBe(3);
    expect(after.updating.size).toBe(0);
  });
});
