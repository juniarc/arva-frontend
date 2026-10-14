import { ButtonLink } from "@/components/ui/Button";

/** Shown when no product matches. "Reset filters" is a link to /products with no query, so it clears everything. */
export function EmptyProducts({ search }: { search?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
      <p className="text-sm text-ink">
        {search ? `No products match "${search}". Try other words, or fewer filters.` : "No products match these filters."}
      </p>
      <ButtonLink href="/products" variant="brand" className="w-auto px-8">
        Reset filters
      </ButtonLink>
    </div>
  );
}
