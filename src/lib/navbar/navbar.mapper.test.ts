import { describe, expect, it } from "vitest";
import { makeProfile } from "@/features/profile/profile.fixture";
import { makeMyShop, makeShop } from "@/features/shops/shop.fixture";
import { linePrice, parseMe, parseNavbarCart, toNavbarShop, toNavbarUser, truncateName } from "./navbar.mapper";

const cartDto = (count: number) => ({
  items: Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    quantity: 2,
    product: { id: 9, slug: "banana", name: `Banana ${index + 1}`, imageUrl: "/b.jpg", shop: { slug: "farm", name: "Farm" }, extra: true },
    variant: { id: 5, label: "1 kg", unit: "kg", price: 1000, stock: 4 },
  })),
  itemCount: count * 2,
  subtotal: count * 2000,
  somethingNew: "ignored",
});

describe("parseNavbarCart", () => {
  it("maps the cart and ignores extra fields", () => {
    expect(parseNavbarCart(cartDto(1))).toEqual({
      itemCount: 2,
      items: [{ id: "1", name: "Banana 1", imageUrl: "/b.jpg", variantLabel: "1 kg", unitPrice: 1000, quantity: 2 }],
    });
  });

  it("is null for a wrong shape", () => {
    expect(parseNavbarCart({ items: "nope" })).toBeNull();
  });
});

describe("parseMe and toNavbarUser", () => {
  it("reads the user from /auth/me, ignoring extra fields", () => {
    expect(parseMe({ user: { user_id: 1, username: "agus", email: "a@x.co", role: "x" } })).toEqual({ username: "agus", email: "a@x.co" });
    expect(parseMe({ nope: true })).toBeNull();
  });

  it("prefers the profile's username and email, and takes its photo", () => {
    const profile = makeProfile({ user: { ...makeProfile().user, photoUrl: "https://cdn.test/me.jpg" } });
    expect(toNavbarUser({ username: "old", email: "old@x.co" }, profile)).toEqual({
      username: "agus_01",
      email: "agus@example.com",
      photoUrl: "https://cdn.test/me.jpg",
    });
  });

  it("falls back to /auth/me and the default avatar when the profile is missing", () => {
    expect(toNavbarUser({ username: "agus", email: "a@x.co" }, null)).toEqual({ username: "agus", email: "a@x.co", photoUrl: null });
    expect(toNavbarUser(null, null)).toEqual({ username: null, email: null, photoUrl: null });
  });
});

describe("toNavbarShop", () => {
  it("takes the city and rating from the public shop", () => {
    expect(toNavbarShop(makeMyShop(), makeShop())).toEqual({
      status: "shop",
      slug: "bali-fresh-farm",
      name: "Bali Fresh Farm",
      logoUrl: null,
      city: "Jakarta",
      rating: { average: 3.4, ratingCount: 10 },
    });
  });

  it("uses the name and logo from /shops/me, and leaves city and rating empty, without the public shop", () => {
    expect(toNavbarShop(makeMyShop({ name: "Own Name" }), null)).toMatchObject({ name: "Own Name", city: null, rating: null });
  });
});

describe("helpers", () => {
  it("writes the line price as quantity x unit price", () => {
    expect(linePrice(2, 1000)).toBe("2 x Rp 1.000");
  });

  it("truncates a long shop name after 14 characters", () => {
    expect(truncateName("Bali Fresh Farm Organic")).toBe("Bali Fresh Far…");
    expect(truncateName("Short Name")).toBe("Short Name");
    expect(truncateName("Exactly14Chars")).toBe("Exactly14Chars");
  });
});
