import type { ReactNode } from "react";

/** Shared look of every input and select in the profile page. Tap targets are 44px below 1024px. */
export const INPUT_CLASS =
  "min-h-11 w-full rounded-sm border border-line/60 bg-white px-3 text-sm text-ink outline-none focus:border-brand " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger lg:min-h-9 lg:text-xs";

const ROW = "grid grid-cols-[2fr_3fr] items-start gap-x-3 gap-y-1 py-2 text-sm lg:grid-cols-[1fr_2fr] lg:text-xs";

/** What the input needs to be linked to its label, hint, counter and error. */
export interface FieldAria {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

interface ProfileFieldProps {
  id: string;
  label: string;
  mode: "read" | "edit";
  /** Read mode: the value, or null for "not set". */
  value?: string | null;
  error?: string;
  /** Edit mode: a line that explains the field, for example why it is disabled. */
  hint?: string;
  counter?: { length: number; max: number };
  /** Edit mode: the input, given the attributes that link it to the text around it. */
  children?: (aria: FieldAria) => ReactNode;
}

/** A label on the left and a value (read) or an input (edit) on the right. */
export function ProfileField({ id, label, mode, value, error, hint, counter, children }: ProfileFieldProps) {
  if (mode === "read") {
    return (
      <div className={ROW}>
        <dt className="text-muted">{label}</dt>
        <dd className="min-w-0 break-words text-ink">{value || <span className="text-muted">Not set</span>}</dd>
      </div>
    );
  }

  const describedBy = [hint && `${id}-hint`, counter && `${id}-count`, error && `${id}-error`].filter(Boolean).join(" ");

  return (
    <div className={ROW}>
      <label htmlFor={id} className="pt-3 text-muted lg:pt-2">
        {label}
      </label>
      <div className="min-w-0">
        {children?.({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy || undefined })}
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
    </div>
  );
}

/** The rows of a section. Read mode is a description list; edit mode is plain rows inside the form. */
export function ProfileFieldList({ editing, children }: { editing: boolean; children: ReactNode }) {
  return editing ? <div>{children}</div> : <dl>{children}</dl>;
}
