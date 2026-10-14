import { z } from "zod";
import { isKnownCity } from "../constants/cities";
import { SORT_VALUES, type SortValue } from "../constants/sort-options";

/**
 * Everything the products page keeps in the URL. Pure functions only: they parse and validate
 * the query string, and build links. Invalid values are dropped, never passed on to the API.
 */

export interface ProductsFilters {
  /** Search words from the header's search box. */
  q?: string;
  /** A category slug. */
  category?: string;
  sort?: SortValue;
  /** Only ever `true`. Absent means "all products". */
  discount?: true;
  /** IDR, whole numbers. */
  minPrice?: number;
  maxPrice?: number;
  /** For example 4 means "rating 4 and above". */
  minRating?: number;
  city?: string;
}

export interface ProductsQuery extends ProductsFilters {
  /** 1 or more. */
  page: number;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

const MAX_PRICE = 1_000_000_000;
const MAX_PAGE = 100_000;

const wholeNumber = (max: number) =>
  z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(0).max(max));

export const MAX_SEARCH_LENGTH = 100;

const fieldSchemas = {
  // Trimmed; an empty search is no search.
  q: z.string().transform((value) => value.trim().replace(/\s+/g, " ")).pipe(z.string().min(1).max(MAX_SEARCH_LENGTH)),
  category: z.string().regex(/^[a-z0-9-]{1,60}$/),
  sort: z.enum(SORT_VALUES),
  discount: z.literal("true").transform(() => true as const),
  minPrice: wholeNumber(MAX_PRICE),
  maxPrice: wholeNumber(MAX_PRICE),
  // The backend only accepts whole numbers from 1 to 5.
  minRating: z.string().regex(/^[1-5]$/).transform(Number),
  city: z.string().refine(isKnownCity),
  page: wholeNumber(MAX_PAGE).pipe(z.number().min(1)),
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readField<K extends keyof typeof fieldSchemas>(
  raw: RawSearchParams,
  key: K,
): z.output<(typeof fieldSchemas)[K]> | undefined {
  const value = firstValue(raw[key]);
  if (value === undefined) return undefined;
  const result = fieldSchemas[key].safeParse(value);
  return result.success ? (result.data as z.output<(typeof fieldSchemas)[K]>) : undefined;
}

/** Reads and validates the URL's search params. Anything invalid is left out. */
export function parseProductsQuery(raw: RawSearchParams): ProductsQuery {
  let minPrice = readField(raw, "minPrice");
  let maxPrice = readField(raw, "maxPrice");
  // A range where the minimum is above the maximum makes no sense: reject both.
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    minPrice = undefined;
    maxPrice = undefined;
  }

  return {
    q: readField(raw, "q"),
    category: readField(raw, "category"),
    sort: readField(raw, "sort"),
    discount: readField(raw, "discount"),
    minPrice,
    maxPrice,
    minRating: readField(raw, "minRating"),
    city: readField(raw, "city"),
    page: readField(raw, "page") ?? 1,
  };
}

/** Drops a category that is not in the list of known category slugs. */
export function dropUnknownCategory(query: ProductsQuery, knownSlugs: readonly string[]): ProductsQuery {
  if (query.category === undefined || knownSlugs.includes(query.category)) return query;
  return { ...query, category: undefined };
}

/** Applies a filter change. Any filter change goes back to page 1. */
export function withFilterChange(query: ProductsQuery, change: ProductsFilters): ProductsQuery {
  return { ...query, ...change, page: 1 };
}

export function withPage(query: ProductsQuery, page: number): ProductsQuery {
  return { ...query, page };
}

/** Removes every filter and the sort. The search stays: resetting filters is not a new search. */
export function clearFilters(q?: string): ProductsQuery {
  return q ? { q, page: 1 } : { page: 1 };
}

/** The filter fields that are set, in a fixed order. Used for both the URL and the API call. */
function entries(query: ProductsQuery): [string, string][] {
  const result: [string, string][] = [];
  if (query.q) result.push(["q", query.q]);
  if (query.category) result.push(["category", query.category]);
  if (query.sort) result.push(["sort", query.sort]);
  if (query.discount) result.push(["discount", "true"]);
  if (query.minPrice !== undefined) result.push(["minPrice", String(query.minPrice)]);
  if (query.maxPrice !== undefined) result.push(["maxPrice", String(query.maxPrice)]);
  if (query.minRating !== undefined) result.push(["minRating", String(query.minRating)]);
  if (query.city) result.push(["city", query.city]);
  if (query.page > 1) result.push(["page", String(query.page)]);
  return result;
}

/** The link for a query, for example `/products?category=fruits&page=2`. Page 1 is left out. */
export function buildProductsHref(query: ProductsQuery): string {
  const search = new URLSearchParams(entries(query)).toString();
  return search ? `/products?${search}` : "/products";
}

/** Query string for the backend. Only values that are set are sent. */
export function toApiParams(query: ProductsQuery, limit: number): URLSearchParams {
  const params = new URLSearchParams(entries({ ...query, page: 1 }));
  params.set("page", String(query.page));
  params.set("limit", String(limit));
  return params;
}

/** True when a filter or a sort is set (the page number does not count). */
export function hasActiveFilters(query: ProductsQuery): boolean {
  return entries({ ...query, page: 1 }).length > 0;
}
