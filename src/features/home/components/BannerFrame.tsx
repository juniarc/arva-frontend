import Link from "next/link";
import type { ReactNode } from "react";

interface BannerFrameProps {
  /** Banners without a link are shown as plain images. */
  href?: string;
  className?: string;
  children: ReactNode;
}

/** Wraps a banner image in a link when the banner has one. */
export function BannerFrame({ href, className = "", children }: BannerFrameProps) {
  if (!href) return <div className={className}>{children}</div>;

  return (
    <Link href={href} className={`${className} focus-visible:outline-2 focus-visible:outline-info`}>
      {children}
    </Link>
  );
}
