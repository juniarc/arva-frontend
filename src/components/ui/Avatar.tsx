"use client";

import { Store, User } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<AvatarSize, { box: string; icon: string; image: string }> = {
  sm: { box: "size-7", icon: "size-4", image: "1.75rem" },
  md: { box: "size-11", icon: "size-5", image: "2.75rem" },
  lg: { box: "size-12", icon: "size-6", image: "3rem" },
  xl: { box: "size-14", icon: "size-7", image: "3.5rem" },
};

interface AvatarProps {
  /** The photo URL, or null for the default. */
  src: string | null;
  /** The person's (or shop's) name, used as the alt text. */
  name: string | null;
  size?: AvatarSize;
  /** "person" for users (default), "shop" for shop logos. */
  kind?: "person" | "shop";
  /** True when the name is already written next to it: screen readers then skip the picture. */
  decorative?: boolean;
  className?: string;
}

/**
 * A round photo. When there is no photo, or it fails to load, a neutral circle with a person (or
 * shop) icon is shown instead, so no default image file is needed.
 */
export function Avatar({ src, name, size = "md", kind = "person", decorative = false, className = "" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const { box, icon, image } = SIZES[size];
  const alt = decorative ? "" : (name ?? (kind === "shop" ? "Default shop logo" : "Default avatar"));
  const showPhoto = src && !failed;
  const Icon = kind === "shop" ? Store : User;

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-muted ${box} ${className}`}>
      {showPhoto ? (
        // Remote photos are loaded by the browser directly, as SafeImage does (the optimizer gets rate limited).
        <Image
          src={src}
          alt={alt}
          fill
          sizes={image}
          unoptimized={/^https?:\/\//.test(src)}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span role={decorative ? undefined : "img"} aria-label={decorative ? undefined : alt} aria-hidden={decorative || undefined} className="flex size-full items-center justify-center">
          <Icon className={icon} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
