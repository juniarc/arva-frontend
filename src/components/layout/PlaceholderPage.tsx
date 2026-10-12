/** Temporary content for routes that are linked from the header but not built yet. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-serif text-3xl font-bold text-brand">{title}</h1>
      <p className="mt-3 text-sm text-muted">This page is coming soon.</p>
    </div>
  );
}
