import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyShopState } from "./EmptyShopState";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

describe("EmptyShopState", () => {
  it("invites the user to open a shop, with a Create Shop link", () => {
    render(<EmptyShopState />);

    expect(screen.getByRole("heading", { level: 1, name: "Let's Open Your Shop" })).toBeInTheDocument();
    expect(screen.getByText(/share your fresh, high-quality agriculture products/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Shop" })).toHaveAttribute("href", "/my-shop/create");
    expect(screen.getByRole("img", { name: /illustration/i })).toBeInTheDocument();
  });
});
