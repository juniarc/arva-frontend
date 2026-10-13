import { Checkbox } from "@/components/ui/Checkbox";

interface SelectAllRowProps {
  /** Total number of items in the cart. */
  itemCount: number;
  selectedCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onClear: () => void;
}

/**
 * Top row of the list. From 1024px: "Select all (N)" and Clear.
 * Below 1024px: "N Selected Products" and Clear (the "All" checkbox lives in the bottom bar).
 * There is one Clear button, so focus can return to it when the dialog closes.
 */
export function SelectAllRow({ itemCount, selectedCount, allSelected, onToggleAll, onClear }: SelectAllRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-line/40 px-4 py-1 lg:px-0 lg:py-3">
      <div className="hidden items-center gap-3 lg:flex">
        <Checkbox label="Select all items" checked={allSelected} onChange={onToggleAll} />
        <span className="text-sm">
          <span className="font-bold">Select all</span> ({itemCount})
        </span>
      </div>
      <p aria-live="polite" className="text-sm md:text-base lg:hidden">
        {selectedCount} Selected Products
      </p>

      <button
        type="button"
        onClick={onClear}
        disabled={selectedCount === 0}
        className="min-h-11 px-2 text-sm font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-info disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline lg:min-h-0 lg:px-0"
      >
        Clear
      </button>
    </div>
  );
}
