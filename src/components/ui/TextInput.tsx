import type { ComponentProps, ReactNode } from "react";

export interface TextInputProps extends Omit<ComponentProps<"input">, "id"> {
  /** Required: also used to build the label, error and input ids. */
  id: string;
  label: string;
  /** Error message shown below the input. */
  error?: string;
  /** Decorative icon on the left. */
  icon?: ReactNode;
  /** Element on the right, e.g. the password visibility button. */
  trailing?: ReactNode;
}

/**
 * Underline-style input with a visible label, an icon, and an error message.
 * States: default, focus (underline turns green), error (red), disabled.
 */
export function TextInput({ id, label, error, icon, trailing, className = "", ...rest }: TextInputProps) {
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
        {label}
      </label>
      <div
        className={`flex min-h-11 items-center gap-3 border-b px-1 transition-colors focus-within:border-brand focus-within:border-b-2 ${
          error ? "border-danger" : "border-line"
        } has-[:disabled]:opacity-60`}
      >
        {icon && <span className="shrink-0 text-ink">{icon}</span>}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed"
          {...rest}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
