"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { PHOTO_ACCEPT, validatePhoto } from "@/features/profile/schemas/photo.schema";
import { PRODUCT_LIMITS } from "../schemas/product-form.schema";

/** A photo in the form: a new file (with a temporary preview URL), or one the product already has. */
export interface PhotoItem {
  id: string;
  url: string;
  /** Set for a new photo picked on this device. */
  file?: File;
  /** Set for a photo the product already has: its id, to keep it. */
  existingId?: string;
}

/** Only previews of new files are temporary browser URLs that need releasing. */
const release = (photo: PhotoItem) => {
  if (photo.file) URL.revokeObjectURL(photo.url);
};

interface ProductMediaPickerProps {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  /** A message from Submit or the server, shown under the photos. */
  error?: string;
  disabled?: boolean;
}

let nextId = 0;

/**
 * "Product Media": up to 5 photos (JPG, PNG or WebP, 2 MB each), shown as square previews.
 * A file that breaks the rules is refused with a message before anything is uploaded.
 */
export function ProductMediaPicker({ photos, onChange, error, disabled }: ProductMediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  // The previews are temporary browser URLs: release them when the form goes away.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach(release), []);

  const add = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const room = PRODUCT_LIMITS.photos - photos.length;
    const problem = files.map(validatePhoto).find((message) => message !== null) ?? null;
    if (problem) {
      setPickError(problem);
      return;
    }
    if (files.length > room) {
      setPickError(`Add up to ${PRODUCT_LIMITS.photos} photos.`);
      return;
    }
    setPickError(null);
    onChange([...photos, ...files.map((file) => ({ id: `photo-${(nextId += 1)}`, file, url: URL.createObjectURL(file) }))]);
  };

  const remove = (photo: PhotoItem) => {
    release(photo);
    setPickError(null);
    onChange(photos.filter((item) => item.id !== photo.id));
  };

  const message = pickError ?? error;

  return (
    <fieldset
      aria-describedby={message ? "product-media-hint product-media-error" : "product-media-hint"}
      className="relative m-0 min-w-0 border-0 py-2"
    >
      <legend className="mb-1 p-0 text-xs text-muted">Product Media</legend>
      <p id="product-media-hint" className="absolute right-0 top-2 text-xs text-danger">
        * Ratio will be 1:1
      </p>

      <ul className="flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <li key={photo.id} className="relative size-16">
            {/* A preview of a file on the user's own device (next/image cannot load blob: URLs), or a saved photo. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={`Photo ${index + 1}`} className="size-full rounded-sm object-cover" />
            <button
              type="button"
              onClick={() => remove(photo)}
              disabled={disabled}
              aria-label={`Remove photo ${index + 1}`}
              className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ink/70 text-white focus-visible:outline-2 focus-visible:outline-info"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </li>
        ))}
        {photos.length < PRODUCT_LIMITS.photos && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="flex size-16 flex-col items-center justify-center rounded-sm border border-dashed border-danger text-[10px] text-danger focus-visible:outline-2 focus-visible:outline-info disabled:opacity-60"
            >
              <Plus className="size-3" aria-hidden="true" />
              Add Photo
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        multiple
        aria-label="Product photo files"
        tabIndex={-1}
        onChange={add}
        className="sr-only"
      />
      <p className="mt-1 text-xs text-muted">
        {photos.length}/{PRODUCT_LIMITS.photos} photos. JPG, PNG or WebP, up to 2 MB each.
      </p>
      {message && (
        <p id="product-media-error" role="alert" className="mt-1 text-xs text-danger">
          {message}
        </p>
      )}
    </fieldset>
  );
}
