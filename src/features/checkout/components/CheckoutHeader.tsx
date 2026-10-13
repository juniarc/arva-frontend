"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Mobile and tablet only: a slim bar with the back arrow, under the global header.
 * The global header already has search, cart and menu, so they are not repeated here
 * (same approach as the product, cart and wishlist pages). With no history to go back to, it goes to the cart.
 */
export function CheckoutHeader() {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/cart");
  };

  return (
    <div className="flex items-center px-2 py-1 lg:hidden">
      <button
        type="button"
        aria-label="Go back"
        onClick={goBack}
        className="flex size-11 items-center justify-center rounded-full text-ink focus-visible:outline-2 focus-visible:outline-info"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
