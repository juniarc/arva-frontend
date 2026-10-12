"use client";

import { Button } from "@/components/ui/Button";

/** Shown when a storefront page cannot load its data, for example when the backend is down. */
export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="text-sm text-muted">We could not load this page. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
