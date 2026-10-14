import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchShops } from "../data/shop.loader";
import { parseShopMatches, ShopMappingError } from "../mappers/shop.mapper";
import { ShopMatches } from "./ShopMatches";

vi.mock("server-only", () => ({}));
vi.mock("../data/shop.loader", () => ({ searchShops: vi.fn() }));

const searchMock = vi.mocked(searchShops);

beforeEach(() => vi.clearAllMocks());

describe("ShopMatches", () => {
  it("lists the matching shops, each linking to its page", async () => {
    searchMock.mockResolvedValue([
      { slug: "bali-fresh-farm", name: "Bali Fresh Farm", city: "Kab. Badung", logoUrl: null, rating: { average: 4.4, ratingCount: 158 } },
    ]);

    render(await ShopMatches({ q: "farm" }));

    expect(searchMock).toHaveBeenCalledWith("farm");
    expect(screen.getByRole("heading", { name: "Shops" })).toBeInTheDocument();
    expect(screen.getByText("Bali Fresh Farm", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Visit/ })).toHaveAttribute("href", "/shops/bali-fresh-farm");
  });

  it("shows nothing when no shop matches", async () => {
    searchMock.mockResolvedValue([]);
    expect(await ShopMatches({ q: "xyzzy" })).toBeNull();
  });
});

describe("parseShopMatches", () => {
  it("maps the list and keeps only safe logo URLs", () => {
    const shops = parseShopMatches({
      shops: [{ slug: "a", name: "A", city: "Jakarta", logoUrl: "javascript:alert(1)", rating: { average: 0, ratingCount: 0 } }],
    });
    expect(shops[0]?.logoUrl).toBeNull();
  });

  it("rejects a wrong shape", () => {
    expect(() => parseShopMatches({ items: [] })).toThrow(ShopMappingError);
  });
});
