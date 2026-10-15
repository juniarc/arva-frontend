import { describe, expect, it, vi } from "vitest";
import OrderHistoryRoute from "./page";

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

describe("/order-history", () => {
  it("forwards to the order history at /orders", () => {
    expect(() => OrderHistoryRoute()).toThrow("REDIRECT:/orders");
  });
});
