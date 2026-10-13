/** Values the backend accepts for `sort`. */
export const SORT_VALUES = ["newest", "popular", "price_asc", "price_desc"] as const;
export type SortValue = (typeof SORT_VALUES)[number];

export interface SortOption {
  id: string;
  /** Text shown in the dropdown and the sheet. */
  label: string;
  /** What goes in the URL and the API call. `undefined` means "send no sort". */
  value: SortValue | undefined;
}

/**
 * UI label to API value, in one place.
 * "Most Suitable" sends no sort. The backend has no "relevance" sort yet (it answers 400),
 * so it falls back to its default, which is `popular`. That makes it look the same as "Most Popular".
 */
const OPTIONS: Record<string, SortOption> = {
  suitable: { id: "suitable", label: "Most Suitable", value: undefined },
  newest: { id: "newest", label: "Newest", value: "newest" },
  popular: { id: "popular", label: "Most Popular", value: "popular" },
  priceDesc: { id: "priceDesc", label: "Price : High to Low", value: "price_desc" },
  priceAsc: { id: "priceAsc", label: "Price : Low to High", value: "price_asc" },
};

/** The order differs between the desktop dropdown and the mobile sheet, as in the design. */
const DESKTOP_ORDER = ["suitable", "newest", "popular", "priceDesc", "priceAsc"] as const;
const MOBILE_ORDER = ["suitable", "newest", "priceDesc", "priceAsc", "popular"] as const;

function pick(ids: readonly string[]): SortOption[] {
  return ids.flatMap((id) => (OPTIONS[id] ? [OPTIONS[id]] : []));
}

export const DESKTOP_SORT_OPTIONS = pick(DESKTOP_ORDER);
export const MOBILE_SORT_OPTIONS = pick(MOBILE_ORDER);

/** The option that matches a sort value from the URL. No value means "Most Suitable". */
export function sortOptionFor(value: SortValue | undefined): SortOption {
  const match = Object.values(OPTIONS).find((option) => option.value === value);
  return match ?? OPTIONS.suitable!;
}
