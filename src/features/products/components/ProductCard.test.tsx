import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "../types";
import { ProductCard } from "./ProductCard";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const base: Product = {
  id: "p1",
  slug: "manggo",
  name: "Manggo",
  categorySlug: "fruits",
  categoryName: "Fruits",
  price: 2000,
  rating: 3.4,
  soldCount: 501,
  city: "Kab. Bandung",
  imageUrl: "/images/dummy/manggo.jpg",
  shopName: "Tani Makmur",
  variants: [{ id: "p1-v1", label: "1 kg", price: 2000, stock: 10, unit: "kg" }],
};

describe("ProductCard", () => {
  it("links to the product page using the name as link text", () => {
    render(<ProductCard product={base} />);

    expect(screen.getByRole("link", { name: "Manggo" })).toHaveAttribute("href", "/products/manggo");
  });

  it("shows price, rating, sold count and city", () => {
    render(<ProductCard product={base} />);

    expect(screen.getByText("Rp 2.000")).toBeInTheDocument();
    expect(screen.getByText("3.4")).toBeInTheDocument();
    expect(screen.getByText("501 sold")).toBeInTheDocument();
    expect(screen.getByText("Kab. Bandung")).toBeInTheDocument();
  });

  it("shows the discount badge and original price when there is a discount", () => {
    render(<ProductCard product={{ ...base, price: 920, originalPrice: 1000, discountPercent: 8 }} />);

    expect(screen.getByText("-8%")).toBeInTheDocument();
    expect(screen.getByText("Rp 1.000")).toBeInTheDocument();
  });

  it("hides the discount badge when discountPercent is missing or zero", () => {
    const { rerender } = render(<ProductCard product={base} />);
    expect(screen.queryByText(/^-\d+%$/)).not.toBeInTheDocument();

    rerender(<ProductCard product={{ ...base, discountPercent: 0 }} />);
    expect(screen.queryByText(/^-\d+%$/)).not.toBeInTheDocument();
  });

  it("has an add-to-cart button labelled with the product name", () => {
    render(<ProductCard product={base} />);

    expect(screen.getByRole("button", { name: "Add Manggo to cart" })).toBeEnabled();
  });
});
