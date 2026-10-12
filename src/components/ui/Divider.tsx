/** A horizontal rule with a short label in the middle, e.g. "Or login with". */
export function Divider({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  );
}
