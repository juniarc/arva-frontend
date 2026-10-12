"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/** Goes back in the browser history, or to the home page when there is nothing to go back to. */
export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={goBack}
      className={`flex size-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-info ${className}`}
    >
      <ArrowLeft className="size-5" aria-hidden="true" />
    </button>
  );
}
