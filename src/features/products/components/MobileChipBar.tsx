"use client";

import { ArrowDownUp, ListFilter, MapPin, Percent, Star } from "lucide-react";
import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { cityLabel } from "../constants/cities";
import type { ProductsQuery } from "../query/products-query";
import { useProductsNavigation } from "../query/useProductsNavigation";
import type { Category } from "../types";
import { MobileFilterSheet } from "./MobileFilterSheet";
import { MobileSortSheet } from "./MobileSortSheet";

type Sheet = "filter" | "sort" | null;

const ICON_BUTTON =
  "flex size-11 shrink-0 items-center justify-center rounded-sm border border-line/60 bg-white text-ink " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info";

interface MobileChipBarProps {
  query: ProductsQuery;
  categories: Category[];
}

/**
 * Mobile and tablet only. A row of chips that scrolls sideways, with the sort and filter buttons
 * fixed at its right end. Location and Category open the filter sheet; Rating and Discount toggle
 * straight away. Sticky, so it stays visible while the grid scrolls.
 */
export function MobileChipBar({ query, categories }: MobileChipBarProps) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const { apply } = useProductsNavigation(query);
  const category = categories.find((item) => item.slug === query.category);

  return (
    <div className="sticky top-0 z-20 border-b border-line/20 bg-white lg:hidden">
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">
          <Chip
            selected={query.city !== undefined}
            icon={<MapPin className="size-4" aria-hidden="true" />}
            onClick={() => setSheet("filter")}
          >
            {query.city ? cityLabel(query.city) : "Location"}
          </Chip>
          <Chip selected={category !== undefined} onClick={() => setSheet("filter")}>
            {category?.name ?? "Category"}
          </Chip>
          <Chip
            selected={query.discount === true}
            icon={<Percent className="size-4" aria-hidden="true" />}
            onClick={() => apply({ discount: query.discount ? undefined : true })}
          >
            Discount
          </Chip>
          <Chip
            selected={query.minRating === 4}
            icon={<Star className="size-4 fill-star text-star" aria-hidden="true" />}
            onClick={() => apply({ minRating: query.minRating === 4 ? undefined : 4 })}
          >
            Rating above 4
          </Chip>
        </div>

        <button type="button" aria-label="Short by" aria-haspopup="dialog" onClick={() => setSheet("sort")} className={ICON_BUTTON}>
          <ArrowDownUp className="size-5" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Filter" aria-haspopup="dialog" onClick={() => setSheet("filter")} className={ICON_BUTTON}>
          <ListFilter className="size-5" aria-hidden="true" />
        </button>
      </div>

      <MobileFilterSheet open={sheet === "filter"} query={query} categories={categories} onClose={() => setSheet(null)} />
      <MobileSortSheet open={sheet === "sort"} query={query} onClose={() => setSheet(null)} />
    </div>
  );
}
