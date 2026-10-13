import { describe, expect, it } from "vitest";
import { removeTitle } from "./RemoveWishlistDialog";

describe("removeTitle", () => {
  it("uses 'item' for one", () => {
    expect(removeTitle(1)).toBe("Remove 1 item from Wishlist ?");
  });

  it("uses 'items' for two or more", () => {
    expect(removeTitle(2)).toBe("Remove 2 items from Wishlist ?");
    expect(removeTitle(10)).toBe("Remove 10 items from Wishlist ?");
  });
});
