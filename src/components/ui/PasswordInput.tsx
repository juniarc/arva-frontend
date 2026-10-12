"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { TextInput, type TextInputProps } from "./TextInput";

type PasswordInputProps = Omit<TextInputProps, "type" | "icon" | "trailing">;

/** Password field with a key icon and a show/hide toggle. */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextInput
      {...props}
      type={visible ? "text" : "password"}
      icon={<KeyRound className="size-4" aria-hidden="true" />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="-mr-1 flex size-11 shrink-0 items-center justify-center text-ink focus-visible:outline-2 focus-visible:outline-info"
        >
          {visible ? (
            <Eye className="size-4" aria-hidden="true" />
          ) : (
            <EyeOff className="size-4" aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
