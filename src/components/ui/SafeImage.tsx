"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export const PLACEHOLDER_IMAGE = "/images/dummy/placeholder.svg";

type SafeImageProps = Omit<ImageProps, "src"> & { src: string };

/** next/image that swaps to the placeholder when the file is missing or fails to load. */
export function SafeImage({ src, alt, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  return <Image {...rest} src={failed ? PLACEHOLDER_IMAGE : src} alt={alt} onError={() => setFailed(true)} />;
}
