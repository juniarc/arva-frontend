export type PageItem = number | "ellipsis";

const WINDOW_SIZE = 5;

/**
 * Page numbers to show: a window of up to 5 numbers around the current page, with an
 * ellipsis on a side that has more pages. For example page 10 of 20: … 8 9 10 11 12 …
 */
export function getPageItems(current: number, totalPages: number): PageItem[] {
  if (totalPages <= WINDOW_SIZE) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const half = Math.floor(WINDOW_SIZE / 2);
  const start = Math.min(Math.max(current - half, 1), totalPages - WINDOW_SIZE + 1);
  const end = start + WINDOW_SIZE - 1;
  const numbers = Array.from({ length: WINDOW_SIZE }, (_, index) => start + index);

  return [...(start > 1 ? (["ellipsis"] as const) : []), ...numbers, ...(end < totalPages ? (["ellipsis"] as const) : [])];
}
