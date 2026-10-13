"use client";

import { UserRound } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { PHOTO_ACCEPT, validatePhoto } from "../schemas/photo.schema";

interface ProfilePhotoProps {
  photoUrl: string | null;
  /** Uploads the file. Resolves true when the photo was saved. */
  onUpload: (file: File) => Promise<boolean>;
}

/** The photo (or a placeholder) and the "Change Profile Photo" button with its file picker. */
export function ProfilePhoto({ photoUrl, onUpload }: ProfilePhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploading = preview !== null;

  // The preview is a temporary browser URL: release it when it is replaced or the page closes.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const problem = validatePhoto(file);
    setError(problem);
    if (problem) return;

    setPreview(URL.createObjectURL(file));
    // On failure the preview goes away and the saved photo is shown again.
    await onUpload(file);
    setPreview(null);
  };

  const shown = preview ?? photoUrl;

  return (
    <div className="flex flex-col items-center gap-2 py-4 lg:items-stretch lg:py-0">
      <div className="relative size-24 overflow-hidden rounded-md bg-surface lg:size-auto lg:aspect-square lg:w-full">
        {shown ? (
          <SafeImage src={shown} alt="Your profile photo" fill sizes="(min-width: 1024px) 15rem, 6rem" unoptimized={preview !== null} className="object-cover" />
        ) : (
          <div role="img" aria-label="No profile photo" className="flex size-full items-center justify-center text-muted">
            <UserRound className="size-1/2" strokeWidth={1} aria-hidden="true" />
          </div>
        )}
        {uploading && (
          <div role="status" aria-label="Uploading photo" className="absolute inset-0 flex items-center justify-center bg-ink/30">
            <span aria-hidden="true" className="size-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        aria-label="Profile photo file"
        tabIndex={-1}
        onChange={pick}
        className="sr-only"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="min-h-11 px-2 text-sm font-bold text-brand focus-visible:outline-2 focus-visible:outline-info disabled:opacity-60 lg:rounded-sm lg:border lg:border-line/60 lg:text-xs"
      >
        Change Profile Photo
      </button>
      {error && (
        <p role="alert" className="text-center text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
