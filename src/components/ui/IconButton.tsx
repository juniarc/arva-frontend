import type { ComponentProps } from "react";

interface IconButtonProps extends ComponentProps<"button"> {
  /** Accessible name. The icon itself is decorative. */
  label: string;
}

/** Small mint square button holding one icon. The invisible ::after enlarges the tap target to 44px. */
export function IconButton({ label, className = "", type = "button", children, ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`relative flex size-8 items-center justify-center rounded-sm bg-mint text-brand after:absolute after:-inset-1.5 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
