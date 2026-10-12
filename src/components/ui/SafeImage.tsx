"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export const PLACEHOLDER_IMAGE = "/images/dummy/placeholder.svg";

type SafeImageProps = Omit<ImageProps, "src"> & { src: string };

/**
 * next/image that swaps to the placeholder when the file is missing or fails to load.
 * Images on another host (for example Wikimedia photos from the API) are loaded by the browser
 * directly. Routing them through the Next.js optimizer makes it fetch the same file once per width
 * at the same moment, which gets rate limited (HTTP 429). Local images are still optimized.
 * Once the backend has its own image host or CDN, remove `unoptimized` and allow the host in next.config.ts.
 */
export function SafeImage({ src, alt, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const isRemote = /^https?:\/\//.test(src);

  return (
    <Image
      {...rest}
      src={failed ? PLACEHOLDER_IMAGE : src}
      alt={alt}
      unoptimized={isRemote && !failed ? true : rest.unoptimized}
      onError={() => setFailed(true)}
    />
  );
}
