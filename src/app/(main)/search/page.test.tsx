import { describe, expect, it, vi } from "vitest";
import SearchPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

const search = (params: Record<string, string>) => SearchPage({ searchParams: Promise.resolve(params) });

describe("/search", () => {
  it("shows the search on the products page", async () => {
    await expect(search({ q: " fresh  mango " })).rejects.toThrow("REDIRECT:/products?q=fresh+mango");
  });

  it("sends an empty search to all products", async () => {
    await expect(search({ q: "  " })).rejects.toThrow("REDIRECT:/products");
    await expect(search({})).rejects.toThrow("REDIRECT:/products");
  });
});
