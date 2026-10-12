import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "brand" | "brand-outline" | "outline" | "mint";

const BASE =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm px-4 text-sm " +
  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-info disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-charcoal font-serif font-bold text-white hover:bg-ink",
  brand: "bg-brand font-serif font-bold text-white hover:brightness-110",
  "brand-outline": "border border-brand bg-white font-semibold text-brand hover:bg-mint/30",
  mint: "bg-mint font-serif font-bold text-ink hover:brightness-95",
  outline: "border border-line bg-white font-medium text-ink hover:bg-mint/30",
};

/** Class names shared by <Button> and <ButtonLink> so they always look the same. */
export function buttonStyles(variant: ButtonVariant): string {
  return `${BASE} ${VARIANTS[variant]}`;
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonStyles(variant)} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
}

export function ButtonLink({ variant = "mint", className = "", ...rest }: ButtonLinkProps) {
  return <Link className={`${buttonStyles(variant)} ${className}`} {...rest} />;
}
