"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { PRODUCT_LIMITS } from "../schemas/product-form.schema";

interface TagsInputProps {
  id: string;
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * "Tags / Keywords": type a tag and press Enter (or a comma) to add it. Backspace in the empty box
 * removes the last one. A tag is at most 30 characters, and the same tag is not added twice.
 */
export function TagsInput({ id, label, value, onChange, error, disabled }: TagsInputProps) {
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  const commit = () => {
    const tag = draft.trim().replace(/,+$/, "").trim();
    if (!tag) return;
    if (value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      setHint(`"${tag}" is already added.`);
    } else if (value.length >= PRODUCT_LIMITS.tags) {
      setHint(`Add at most ${PRODUCT_LIMITS.tags} tags.`);
    } else {
      onChange([...value, tag]);
      setHint(null);
    }
    setDraft("");
  };

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const message = error ?? hint;

  return (
    <div className="py-2">
      <label htmlFor={id} className="mb-1 block text-xs text-muted">
        {label}
      </label>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-sm border border-line/60 bg-white px-2 py-1.5 focus-within:border-brand">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-xs text-ink">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              disabled={disabled}
              aria-label={`Remove tag ${tag}`}
              className="flex size-5 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-info"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          maxLength={PRODUCT_LIMITS.tag}
          disabled={disabled}
          placeholder={value.length === 0 ? "Add tags" : ""}
          aria-describedby={`${id}-hint${message ? ` ${id}-error` : ""}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={keyDown}
          onBlur={commit}
          className="min-w-24 flex-1 bg-transparent py-1 text-sm text-ink outline-none"
        />
      </div>
      <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
        Press Enter to add a tag. {value.length}/{PRODUCT_LIMITS.tags}
      </p>
      {message && (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {message}
        </p>
      )}
    </div>
  );
}
