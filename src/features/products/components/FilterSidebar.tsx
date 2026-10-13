"use client";

import { ChevronDown, MapPin, Percent, Star } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { CITY_OPTIONS } from "../constants/cities";
import { categoryIcon } from "../data/categories";
import type { ProductsQuery } from "../query/products-query";
import { useProductsNavigation } from "../query/useProductsNavigation";
import type { Category } from "../types";
import { PriceRangeInputs } from "./PriceRangeInputs";

const OPTION =
  "flex min-h-8 w-full items-center gap-3 rounded-sm px-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-info";

function optionClass(selected: boolean): string {
  return `${OPTION} ${selected ? "bg-mint font-medium text-brand" : "text-ink hover:bg-surface"}`;
}

/** One collapsible section: a heading button (aria-expanded) that shows or hides a group. */
function Accordion({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(true);

  return (
    <section className="border-b border-line/40 py-3 last:border-b-0">
      <h3>
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between text-sm font-bold focus-visible:outline-2 focus-visible:outline-info"
        >
          {title}
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </h3>
      <div id={`${id}-panel`} role="group" aria-labelledby={`${id}-button`} hidden={!open} className="mt-2">
        {children}
      </div>
    </section>
  );
}

interface FilterSidebarProps {
  query: ProductsQuery;
  categories: Category[];
}

/** Desktop filter card. Every choice changes the URL at once, and goes back to page 1. */
export function FilterSidebar({ query, categories }: FilterSidebarProps) {
  const { apply } = useProductsNavigation(query);

  return (
    <aside
      aria-label="Filters"
      className="self-start rounded-md border border-line/40 bg-white px-4 py-1 shadow-sm lg:sticky lg:top-6"
    >
      <Accordion title="Category">
        <ul className="flex flex-col gap-1">
          {categories.map((category) => {
            const Icon = categoryIcon(category.iconKey);
            const selected = query.category === category.slug;
            return (
              <li key={category.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => apply({ category: selected ? undefined : category.slug })}
                  className={optionClass(selected)}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {category.name}
                </button>
              </li>
            );
          })}
        </ul>
      </Accordion>

      <Accordion title="Price">
        {/* Remount when the URL changes (for example "Reset filters"), so the inputs show the URL's values. */}
        <PriceRangeInputs
          key={`${query.minPrice ?? ""}-${query.maxPrice ?? ""}`}
          min={query.minPrice}
          max={query.maxPrice}
          minLabel="Lowest Price"
          maxLabel="Highest Price"
          onValid={({ min, max }) => {
            if (min !== query.minPrice || max !== query.maxPrice) apply({ minPrice: min, maxPrice: max });
          }}
        />
      </Accordion>

      <Accordion title="Discount">
        <button
          type="button"
          aria-pressed={query.discount === true}
          onClick={() => apply({ discount: query.discount ? undefined : true })}
          className={optionClass(query.discount === true)}
        >
          <Percent className="size-4" aria-hidden="true" />
          Discount Products
        </button>
      </Accordion>

      <Accordion title="Rating">
        <button
          type="button"
          aria-pressed={query.minRating === 4}
          onClick={() => apply({ minRating: query.minRating === 4 ? undefined : 4 })}
          className={optionClass(query.minRating === 4)}
        >
          <Star className="size-4 fill-star text-star" aria-hidden="true" />
          Rating above 4
        </button>
      </Accordion>

      <Accordion title="Location">
        <ul className="flex flex-col gap-1">
          {CITY_OPTIONS.map((city) => {
            const selected = query.city === city.value;
            return (
              <li key={city.value}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => apply({ city: selected ? undefined : city.value })}
                  className={optionClass(selected)}
                >
                  <MapPin className="size-4" aria-hidden="true" />
                  {city.label}
                </button>
              </li>
            );
          })}
        </ul>
      </Accordion>
    </aside>
  );
}
