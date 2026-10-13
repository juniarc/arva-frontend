import { describe, expect, it } from "vitest";
import { makeCartItem } from "../cart.fixture";
import {
  canBuy,
  clampQuantity,
  groupByShop,
  isAllSelected,
  maxQuantity,
  selectedCount,
  selectedTotal,
  shopCheckState,
  toggleAll,
  toggleItem,
  toggleShop,
} from "./cart-selection";

const a1 = makeCartItem({ id: "a1", price: 2000, quantity: 2 });
const a2 = makeCartItem({ id: "a2", price: 1500, quantity: 1 });
const b1 = makeCartItem({ id: "b1", price: 1000, quantity: 3, shop: { key: "tani", name: "Tani" } });
const items = [a1, a2, b1];

describe("totals", () => {
  it("sums unit price times quantity for selected items only", () => {
    expect(selectedTotal(items, new Set(["a1", "b1"]))).toBe(2000 * 2 + 1000 * 3);
  });

  it("is 0 when nothing is selected", () => {
    expect(selectedTotal(items, new Set())).toBe(0);
  });

  it("counts selected rows, not quantities", () => {
    expect(selectedCount(items, new Set(["a1", "b1"]))).toBe(2);
  });

  it("ignores selected ids that are not in the cart", () => {
    expect(selectedCount(items, new Set(["gone"]))).toBe(0);
  });
});

describe("groupByShop", () => {
  it("groups items by shop in first-seen order", () => {
    const groups = groupByShop([a1, b1, a2]);
    expect(groups.map((group) => group.shop.key)).toEqual(["kebun-bali", "tani"]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(["a1", "a2"]);
  });
});

describe("shopCheckState", () => {
  const [group] = groupByShop([a1, a2]);

  it("is unchecked when none are selected", () => {
    expect(shopCheckState(group!, new Set())).toBe("unchecked");
  });

  it("is mixed when some are selected", () => {
    expect(shopCheckState(group!, new Set(["a1"]))).toBe("mixed");
  });

  it("is checked when all are selected", () => {
    expect(shopCheckState(group!, new Set(["a1", "a2"]))).toBe("checked");
  });

  it("ignores out-of-stock items", () => {
    const [mixedGroup] = groupByShop([a1, makeCartItem({ id: "x", stock: 0 })]);
    expect(shopCheckState(mixedGroup!, new Set(["a1"]))).toBe("checked");
  });
});

describe("toggling", () => {
  it("toggles one item on and off", () => {
    const on = toggleItem(new Set(), a1);
    expect([...on]).toEqual(["a1"]);
    expect(toggleItem(on, a1).size).toBe(0);
  });

  it("cannot select an out-of-stock item", () => {
    expect(toggleItem(new Set(), makeCartItem({ id: "x", stock: 0 })).size).toBe(0);
  });

  it("selects a whole shop, then deselects it", () => {
    const [group] = groupByShop([a1, a2]);
    const all = toggleShop(new Set(["a1"]), group!);
    expect([...all].sort()).toEqual(["a1", "a2"]);
    expect(toggleShop(all, group!).size).toBe(0);
  });

  it("selects all, then deselects all", () => {
    const all = toggleAll(items, new Set());
    expect(all.size).toBe(3);
    expect(isAllSelected(items, all)).toBe(true);
    expect(toggleAll(items, all).size).toBe(0);
  });

  it("select all skips out-of-stock items", () => {
    const withSoldOut = [a1, makeCartItem({ id: "x", stock: 0 })];
    expect([...toggleAll(withSoldOut, new Set())]).toEqual(["a1"]);
  });

  it("is not 'all selected' for an empty cart", () => {
    expect(isAllSelected([], new Set())).toBe(false);
  });
});

describe("quantity limits", () => {
  it("never goes below 1", () => {
    expect(clampQuantity(a1, 0)).toBe(1);
    expect(clampQuantity(a1, -5)).toBe(1);
  });

  it("never goes above the stock", () => {
    expect(clampQuantity(makeCartItem({ stock: 5 }), 9)).toBe(5);
  });

  it("never goes above 99, even with more stock", () => {
    expect(maxQuantity(makeCartItem({ stock: 500 }))).toBe(99);
    expect(clampQuantity(makeCartItem({ stock: 500 }), 150)).toBe(99);
  });
});

describe("canBuy", () => {
  it("is false when nothing is selected", () => {
    expect(canBuy(0)).toBe(false);
    expect(canBuy(1)).toBe(true);
  });
});
