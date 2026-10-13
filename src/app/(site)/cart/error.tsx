"use client";

import { Button } from "@/components/ui/Button";

/** Shown when the cart cannot be loaded, for example when the backend is down. */
export default function CartError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-bold text-ink">We could not load your cart</h1>
      <p className="text-sm text-muted">Please try again in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
