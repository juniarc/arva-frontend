import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeHomeData } from "./home.fixture";
import { HomeSections } from "./HomeSections";

// The product cards use the router for the guest redirect.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("HomeSections", () => {
  it("renders one h1 and the sections in the expected order", () => {
    render(<HomeSections data={makeHomeData()} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const sectionTitles = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(sectionTitles).toEqual(["Category", "Popular Products", "Fruits", "Browse by Categories", "Equipments"]);
  });

  it("shows the products it is given in each section", () => {
    render(<HomeSections data={makeHomeData()} />);

    expect(screen.getByRole("region", { name: "Popular Products" }).querySelectorAll("article")).toHaveLength(8);
    expect(screen.getByRole("region", { name: "Fruits" }).querySelectorAll("article")).toHaveLength(4);
    expect(screen.getByRole("region", { name: "Equipments" }).querySelectorAll("article")).toHaveLength(4);
  });

  it("builds category links from the API categories", () => {
    render(<HomeSections data={makeHomeData()} />);

    expect(screen.getAllByRole("link", { name: "Seeds" })[0]).toHaveAttribute("href", "/products?category=seeds");
  });

  it("still renders when there are no banners or categories", () => {
    const data = makeHomeData();
    data.banners = { carousel: [], promoStrips: [], sideBanners: [], verticalBanners: [] };
    data.categories = [];

    render(<HomeSections data={data} />);

    expect(screen.getByRole("region", { name: "Popular Products" })).toBeInTheDocument();
  });
});
