import { Search } from "lucide-react";

/** Plain GET form: submitting goes to /search?q=... (the page is a placeholder for now). */
export function SearchBar({ className = "" }: { className?: string }) {
  return (
    <form action="/search" role="search" className={`flex ${className}`}>
      <label htmlFor="header-search" className="sr-only">
        Search for products, categories and shops
      </label>
      <input
        id="header-search"
        name="q"
        type="search"
        placeholder="Search for products, categories and shops"
        className="h-11 min-w-0 flex-1 rounded-l-sm border border-r-0 border-line px-3 text-xs text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-info"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex size-11 shrink-0 items-center justify-center rounded-r-sm bg-brand text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
