/**
 * Products per page, the same on every screen size.
 * The server cannot know the screen size, and page numbers in the URL must mean the same products
 * everywhere (shared links, back button). 12 fills whole rows in every grid:
 * 2 columns x 6 rows (mobile), 3 x 4 (tablet) and 4 x 3 (desktop).
 */
export const PRODUCTS_PAGE_SIZE = 12;
