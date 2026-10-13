"use client";

import { MapPin, Percent, Star } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CITY_OPTIONS } from "../constants/cities";
import { categoryIcon } from "../data/categories";
import type { ProductsFilters, ProductsQuery } from "../query/products-query";
import { useProductsNavigation } from "../query/useProductsNavigation";
import type { Category } from "../types";
import { FilterSheetShell } from "./FilterSheetShell";
import { PriceRangeInputs } from "./PriceRangeInputs";

interface MobileFilterSheetProps {
  open: boolean;
  query: ProductsQuery;
  categories: Category[];
  onClose: () => void;
}

/** The filters the sheet edits. Sort is not one of them: it has its own sheet. */
type Draft = Omit<ProductsFilters, "sort">;

function draftFrom(query: ProductsQuery): Draft {
  return {
    category: query.category,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    minRating: query.minRating,
    city: query.city,
    discount: query.discount,
  };
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-4">
      <legend className="mb-2 text-sm font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Filter sheet. Taps change a local draft only. "Show Products" puts the draft in the URL (one page
 * load) and closes the sheet; "Reset" clears the draft.
 */
export function MobileFilterSheet({ open, query, categories, onClose }: MobileFilterSheetProps) {
  const { apply } = useProductsNavigation(query);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(query));
  const [priceError, setPriceError] = useState<string | undefined>();
  // Changing this remounts the price inputs, so they show the draft after "Reset" or when reopened.
  const [priceKey, setPriceKey] = useState(0);

  // Start from what the URL says every time the sheet opens (and only then, so taps are never undone).
  const queryRef = useRef(query);
  queryRef.current = query;
  useEffect(() => {
    if (!open) return;
    setDraft(draftFrom(queryRef.current));
    setPriceError(undefined);
    setPriceKey((key) => key + 1);
  }, [open]);

  const update = (change: Draft) => setDraft((current) => ({ ...current, ...change }));

  const handleShow = () => {
    if (priceError) return;
    // Every key is listed on purpose: a key that is `undefined` clears that filter in the URL.
    apply({
      category: draft.category,
      minPrice: draft.minPrice,
      maxPrice: draft.maxPrice,
      minRating: draft.minRating,
      city: draft.city,
      discount: draft.discount,
    });
    onClose();
  };

  const handleReset = () => {
    setDraft({});
    setPriceError(undefined);
    setPriceKey((key) => key + 1);
  };

  return (
    <FilterSheetShell open={open} title="Filter" onClose={onClose}>
      <div className="overflow-y-auto px-5 pb-4">
        <Group title="Category">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = categoryIcon(category.iconKey);
              const selected = draft.category === category.slug;
              return (
                <Chip
                  key={category.id}
                  selected={selected}
                  icon={<Icon className="size-4" aria-hidden="true" />}
                  onClick={() => update({ category: selected ? undefined : category.slug })}
                >
                  {category.name}
                </Chip>
              );
            })}
          </div>
        </Group>

        <Group title="Price">
          <PriceRangeInputs
            key={priceKey}
            min={draft.minPrice}
            max={draft.maxPrice}
            minLabel="Lowest"
            maxLabel="Highest"
            applyOnBlur={false}
            onValid={({ min, max }) => update({ minPrice: min, maxPrice: max })}
            onErrorChange={setPriceError}
          />
        </Group>

        <Group title="Rating">
          <Chip
            selected={draft.minRating === 4}
            icon={<Star className="size-4 fill-star text-star" aria-hidden="true" />}
            onClick={() => update({ minRating: draft.minRating === 4 ? undefined : 4 })}
          >
            Rating above 4
          </Chip>
        </Group>

        <Group title="Location">
          <div className="flex flex-wrap gap-2">
            {CITY_OPTIONS.map((city) => (
              <Chip
                key={city.value}
                selected={draft.city === city.value}
                icon={<MapPin className="size-4" aria-hidden="true" />}
                onClick={() => update({ city: draft.city === city.value ? undefined : city.value })}
              >
                {city.label}
              </Chip>
            ))}
          </div>
        </Group>

        <Group title="Discount">
          <Chip
            selected={draft.discount === true}
            icon={<Percent className="size-4" aria-hidden="true" />}
            onClick={() => update({ discount: draft.discount ? undefined : true })}
          >
            Discounted Products
          </Chip>
        </Group>
      </div>

      <div className="flex gap-3 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <Button variant="brand" className="flex-1" onClick={handleShow} disabled={Boolean(priceError)}>
          Show Products
        </Button>
        <Button variant="brand-outline" className="w-auto px-6 font-serif font-bold" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </FilterSheetShell>
  );
}
