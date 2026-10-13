import { ChevronRight, MapPin } from "lucide-react";
import { formatAddress } from "../state/checkout-helpers";
import type { Address } from "../types";

interface DeliveryAddressRowProps {
  /** The draft's address. `null` until the user adds one. */
  address: Address | null;
  onOpen: () => void;
}

/** "Add your address" when there is none; otherwise the saved address. Either way, tapping opens the form. */
export function DeliveryAddressRow({ address, onOpen }: DeliveryAddressRowProps) {
  return (
    <section aria-labelledby="delivery-address-title">
      <h2 id="delivery-address-title" className="font-serif text-xl font-bold md:text-2xl">
        Delivery Address
      </h2>
      <button
        type="button"
        onClick={onOpen}
        className="mt-2 flex min-h-11 w-full items-center justify-between gap-3 border-b border-line/40 pb-3 text-left focus-visible:outline-2 focus-visible:outline-info"
      >
        {address ? (
          <span className="flex min-w-0 flex-col gap-1 text-xs md:text-sm">
            <span className="flex items-center gap-1 font-bold">
              <MapPin className="size-4 shrink-0 text-brand" aria-hidden="true" />
              <span>{address.label}</span>
              <span aria-hidden="true">•</span>
              <span>{address.recipientName}</span>
            </span>
            <span className="line-clamp-2 text-muted">{formatAddress(address)}</span>
          </span>
        ) : (
          <span className="text-xs font-bold md:text-sm">Add your address</span>
        )}
        <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
        <span className="sr-only">{address ? "Edit address" : "Opens the address form"}</span>
      </button>
    </section>
  );
}
