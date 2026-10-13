import { Minus, Plus, Trash2 } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  /** At the minimum, "-" becomes a remove button and asks for 0. */
  removeAtMin?: boolean;
  onChange: (next: number) => void;
}

const STEP_BUTTON =
  "flex size-11 items-center justify-center text-ink hover:bg-surface focus-visible:outline-2 " +
  "focus-visible:outline-info disabled:cursor-not-allowed disabled:opacity-40 lg:size-9";

/** "-", the number (read-only), "+". "+" stops at `max`; "-" stops at `min`, or removes the item when `removeAtMin` is set. */
export function QuantityStepper({
  value,
  min = 1,
  max,
  disabled = false,
  removeAtMin = false,
  onChange,
}: QuantityStepperProps) {
  const removes = removeAtMin && value <= min;

  return (
    <div className="flex items-center rounded-sm border border-line">
      <button
        type="button"
        aria-label={removes ? "Remove item" : "Decrease quantity"}
        disabled={disabled || (!removeAtMin && value <= min)}
        onClick={() => onChange(removes ? 0 : value - 1)}
        className={STEP_BUTTON}
      >
        {removes ? <Trash2 className="size-4" aria-hidden="true" /> : <Minus className="size-4" aria-hidden="true" />}
      </button>
      <input
        type="text"
        inputMode="numeric"
        readOnly
        aria-label="Quantity"
        value={value}
        className="h-11 w-12 border-x border-line bg-transparent text-center text-sm outline-none lg:h-9"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        className={STEP_BUTTON}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
