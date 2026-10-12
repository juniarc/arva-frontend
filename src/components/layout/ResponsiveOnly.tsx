import type { ReactNode } from "react";

/**
 * The one way to show or hide parts of a page by screen size.
 * Desktop means 1024px and up (Tailwind `lg`). Mobile and tablet share the same layout.
 */
export function DesktopOnly({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`hidden lg:block ${className}`}>{children}</div>;
}

export function BelowDesktop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`lg:hidden ${className}`}>{children}</div>;
}
