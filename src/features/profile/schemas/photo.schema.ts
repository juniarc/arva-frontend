export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const PHOTO_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
/** For the file picker's `accept` attribute. */
export const PHOTO_ACCEPT = PHOTO_TYPES.join(",");

export const PHOTO_TYPE_MESSAGE = "Choose a JPG, PNG or WebP image.";
export const PHOTO_SIZE_MESSAGE = "The photo must be 2 MB or smaller.";

/** The message for a file that cannot be uploaded, or null when it can. Used before any request is made. */
export function validatePhoto(file: { type: string; size: number }): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return PHOTO_TYPE_MESSAGE;
  if (file.size === 0 || file.size > PHOTO_MAX_BYTES) return PHOTO_SIZE_MESSAGE;
  return null;
}
