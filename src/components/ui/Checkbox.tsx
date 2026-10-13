"use client";

import { Check, Minus } from "lucide-react";
import { useEffect, useRef } from "react";

interface CheckboxProps {
  /** Accessible name, e.g. "Select item Banana". There is no visible label text. */
  label: string;
  checked: boolean;
  /** Shows a dash and aria-checked="mixed" (some, but not all, children are checked). */
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
  className?: string;
}

/**
 * Native checkbox drawn with the brand colours. The wrapper is 44px for touch and 24px from 1024px.
 * The dash is set through the DOM `indeterminate` property, which React has no prop for.
 */
export function Checkbox({ label, checked, indeterminate = false, disabled, onChange, className = "" }: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <span className={`relative flex size-11 shrink-0 items-center justify-center lg:size-6 ${className}`}>
      <input
        ref={inputRef}
        type="checkbox"
        aria-label={label}
        aria-checked={indeterminate ? "mixed" : undefined}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer size-6 cursor-pointer appearance-none rounded-sm border border-brand bg-white checked:bg-brand indeterminate:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info disabled:cursor-not-allowed disabled:border-line disabled:opacity-40"
      />
      <Check
        className="pointer-events-none absolute hidden size-4 text-white peer-checked:block peer-indeterminate:hidden"
        aria-hidden="true"
      />
      <Minus
        className="pointer-events-none absolute hidden size-4 text-white peer-indeterminate:block"
        aria-hidden="true"
      />
    </span>
  );
}
