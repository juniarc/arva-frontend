import Link from "next/link";
import type { ReactNode } from "react";
import {
  InstagramIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons/brand-icons";

// Placeholder social URLs until real accounts exist.
const SOCIAL_LINKS: { label: string; href: string; icon: ReactNode }[] = [
  { label: "Arva on X", href: "#", icon: <XIcon className="size-3" /> },
  { label: "Arva on Instagram", href: "#", icon: <InstagramIcon className="size-3" /> },
  { label: "Arva on TikTok", href: "#", icon: <TikTokIcon className="size-3" /> },
  { label: "Arva on YouTube", href: "#", icon: <YouTubeIcon className="size-3.5" /> },
];

const Separator = () => (
  <span aria-hidden="true" className="hidden opacity-70 sm:inline">
    |
  </span>
);

/** Dark green utility bar at the very top of every page. */
export function TopBar() {
  return (
    <div className="bg-brand text-[11px] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:justify-end sm:px-6">
        <Link href="/bulk-orders" className="hidden min-h-11 items-center sm:flex hover:underline">
          Bulk Order Inquiries
        </Link>
        <Separator />
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Follow us on</span>
          {SOCIAL_LINKS.map(({ label, href, icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="flex size-11 items-center justify-center hover:opacity-80 sm:size-7"
            >
              {icon}
            </a>
          ))}
        </div>
        <Separator />
        <Link href="/help" className="flex min-h-11 items-center hover:underline">
          Help Center
        </Link>
      </div>
    </div>
  );
}
