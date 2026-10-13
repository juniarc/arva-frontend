import { describe, expect, it } from "vitest";
import { makeWishlist, makeWishlistItem } from "../wishlist.fixture";
import { createInitialState, wishlistReducer } from "./wishlist-reducer";

const [a, b, c] = [makeWishlistItem(1), makeWishlistItem(2), makeWishlistItem(3)];
const initial = createInitialState(makeWishlist([a, b, c]));
const ids = (state: { items: { id: string }[] }) => state.items.map((item) => item.id);

describe("wishlistReducer", () => {
  it("optimistic remove takes the card out at once and counts one less", () => {
    const next = wishlistReducer(initial, { type: "remove/optimistic", id: "2" });

    expect(ids(next)).toEqual(["1", "3"]);
    expect(next.itemCount).toBe(2);
  });

  it("rollback puts the card back at the same position", () => {
    const removed = wishlistReducer(initial, { type: "remove/optimistic", id: "2" });
    const restored = wishlistReducer(removed, { type: "remove/rollback" });

    expect(ids(restored)).toEqual(["1", "2", "3"]);
    expect(restored.itemCount).toBe(3);
    expect(restored.pending).toBeNull();
  });

  it("rollback restores the first and the last card too", () => {
    const first = wishlistReducer(wishlistReducer(initial, { type: "remove/optimistic", id: "1" }), { type: "remove/rollback" });
    const last = wishlistReducer(wishlistReducer(initial, { type: "remove/optimistic", id: "3" }), { type: "remove/rollback" });

    expect(ids(first)).toEqual(["1", "2", "3"]);
    expect(ids(last)).toEqual(["1", "2", "3"]);
  });

  it("replaces the list with the server's wishlist on success", () => {
    const removed = wishlistReducer(initial, { type: "remove/optimistic", id: "2" });
    // The server also reports that item 3 is now sold out: its answer wins.
    const server = makeWishlist([a, makeWishlistItem(3, { isAvailable: false })]);

    const next = wishlistReducer(removed, { type: "list/replace", wishlist: server });

    expect(ids(next)).toEqual(["1", "3"]);
    expect(next.items[1]?.isAvailable).toBe(false);
    expect(next.itemCount).toBe(2);
    expect(next.pending).toBeNull();
  });

  it("ignores removing an id that is not in the list", () => {
    expect(wishlistReducer(initial, { type: "remove/optimistic", id: "99" })).toBe(initial);
  });

  it("ignores a rollback when nothing was removed", () => {
    expect(wishlistReducer(initial, { type: "remove/rollback" })).toBe(initial);
  });

  it("can remove the last item and show an empty list", () => {
    const only = createInitialState(makeWishlist([a]));
    expect(wishlistReducer(only, { type: "remove/optimistic", id: "1" }).items).toEqual([]);
  });
});
