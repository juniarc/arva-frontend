interface PaymentMethodRowProps {
  method: { id: string; label: string } | null;
  pending: boolean;
  onOpen: () => void;
}

/** The chosen payment method with a filled radio. "See all" and the row both open the list. */
export function PaymentMethodRow({ method, pending, onOpen }: PaymentMethodRowProps) {
  return (
    <section aria-labelledby="payment-method-title" className="border-t border-line/40 pt-3">
      <div className="flex items-center justify-between">
        <h2 id="payment-method-title" className="font-serif text-xl font-bold md:text-2xl">
          Payment Method
        </h2>
        <button
          type="button"
          onClick={onOpen}
          className="flex min-h-11 items-center text-xs underline focus-visible:outline-2 focus-visible:outline-info"
        >
          See all
        </button>
      </div>

      <button
        type="button"
        onClick={onOpen}
        aria-busy={pending || undefined}
        className="mt-1 flex min-h-11 w-full items-center gap-3 text-left text-xs focus-visible:outline-2 focus-visible:outline-info"
      >
        <span aria-hidden="true" className="size-6 shrink-0 rounded-sm bg-chip" />
        <span className="flex-1">{method ? method.label : "Select payment method"}</span>
        <span
          aria-hidden="true"
          className={`flex size-5 items-center justify-center rounded-full border-2 border-brand ${
            method ? "after:size-2.5 after:rounded-full after:bg-brand" : ""
          }`}
        />
      </button>
    </section>
  );
}
