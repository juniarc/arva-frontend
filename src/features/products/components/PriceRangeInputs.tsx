"use client";

import { useId, useState } from "react";

interface PriceRangeInputsProps {
  min: number | undefined;
  max: number | undefined;
  /** Visible labels. They differ between the sidebar ("Lowest Price") and the sheet ("Lowest"). */
  minLabel: string;
  maxLabel: string;
  /** Called with a range whose minimum is not above its maximum. */
  onValid: (range: { min: number | undefined; max: number | undefined }) => void;
  /** Called whenever the error changes, so a parent with its own Apply button can block it. */
  onErrorChange?: (error: string | undefined) => void;
  /** true (sidebar): validate and apply on blur or Enter. false (sheet): on every change, and the parent applies later. */
  applyOnBlur?: boolean;
}

const RANGE_ERROR = "Lowest price cannot be higher than highest price.";

/** Parses what the user typed. Digits only; empty means "not set". */
function toNumber(text: string): number | undefined {
  const digits = text.replace(/\D/g, "");
  return digits === "" ? undefined : Number(digits);
}

/** Two "Rp" inputs with a visible label and an inline error when the minimum is above the maximum. */
export function PriceRangeInputs({
  min,
  max,
  minLabel,
  maxLabel,
  onValid,
  onErrorChange,
  applyOnBlur = true,
}: PriceRangeInputsProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [minText, setMinText] = useState(min?.toString() ?? "");
  const [maxText, setMaxText] = useState(max?.toString() ?? "");
  const [error, setError] = useState<string | undefined>();

  const validate = (nextMin: string, nextMax: string) => {
    const low = toNumber(nextMin);
    const high = toNumber(nextMax);
    const message = low !== undefined && high !== undefined && low > high ? RANGE_ERROR : undefined;
    setError(message);
    onErrorChange?.(message);
    if (!message) onValid({ min: low, max: high });
    return message === undefined;
  };

  const change = (setText: (value: string) => void, value: string, other: string, isMin: boolean) => {
    const digits = value.replace(/\D/g, "");
    setText(digits);
    if (!applyOnBlur) validate(isMin ? digits : other, isMin ? other : digits);
  };

  const commit = () => {
    if (applyOnBlur) validate(minText, maxText);
  };

  const field = (
    inputId: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
  ) => (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-xs text-muted">
        {label}
      </label>
      <div
        className={`flex min-h-11 items-center gap-2 rounded-sm border px-3 focus-within:border-brand ${
          error ? "border-danger" : "border-line/60"
        }`}
      >
        <span aria-hidden="true" className="text-xs font-bold">
          Rp
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {field(`${id}-min`, minLabel, minText, (value) => change(setMinText, value, maxText, true))}
      {field(`${id}-max`, maxLabel, maxText, (value) => change(setMaxText, value, minText, false))}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
