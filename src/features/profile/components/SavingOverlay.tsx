/** Covers the section being saved: a white box with a spinner, announced as "Saving". */
export function SavingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/20">
      <div role="status" aria-label="Saving" className="flex size-16 items-center justify-center rounded-sm bg-white shadow-md">
        <span aria-hidden="true" className="size-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    </div>
  );
}
