import type { ReactNode } from "react";

/** Shared look of every input and select in the shop form. Tap targets are 44px below 1024px. */
export const FIELD_CLASS =
  "min-h-11 w-full rounded-sm border border-line/60 bg-white px-3 text-sm text-ink outline-none focus:border-brand " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger";

/** What the input needs to be linked to its label, hint, counter and error. */
export interface FieldAria {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  /** A line that explains the field, for example why it is disabled. */
  hint?: string;
  counter?: { length: number; max: number };
  /** The input, given the attributes that link it to the text around it. */
  children: (aria: FieldAria) => ReactNode;
}

/** A label above an input, with its hint, counter and error linked by aria-describedby. */
export function FormField({ id, label, error, hint, counter, children }: FormFieldProps) {
  const describedBy = [hint && `${id}-hint`, counter && `${id}-count`, error && `${id}-error`].filter(Boolean).join(" ");

  return (
    <div className="py-2">
      <label htmlFor={id} className="mb-1 block text-xs text-muted">
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy || undefined })}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {counter && (
        <p id={`${id}-count`} className="mt-1 text-right text-xs text-muted">
          {counter.length}/{counter.max}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
