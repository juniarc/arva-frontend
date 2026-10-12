import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getHomeSections } from "../data/home.loader";
import { HomeSections } from "./HomeSections";

// The product cards use the router for the guest redirect.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("HomeSections", () => {
  it("renders one h1 and the sections in the expected order", async () => {
    render(<HomeSections data={await getHomeSections()} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const sectionTitles = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(sectionTitles).toEqual([
      "Category",
      "Popular Products",
      "Fruits",
      "Browse by Categories",
      "Equipments",
    ]);
  });

  it("shows eight popular products and four fruits", async () => {
    render(<HomeSections data={await getHomeSections()} />);

    const popular = screen.getByRole("region", { name: "Popular Products" });
    const fruits = screen.getByRole("region", { name: "Fruits" });

    expect(popular.querySelectorAll("article")).toHaveLength(8);
    expect(fruits.querySelectorAll("article")).toHaveLength(4);
  });
});
