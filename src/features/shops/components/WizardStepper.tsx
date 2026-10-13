import { Check } from "lucide-react";

export const WIZARD_STEPS = ["Identity Verification", "Shop Information", "Upload Product"] as const;

/** The three steps as circles joined by lines. A finished step shows a check; the current one is marked for screen readers. */
export function WizardStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Create shop progress" className="mx-auto flex w-full max-w-md items-start lg:mx-0">
      {WIZARD_STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;

        return (
          <li key={label} aria-current={active ? "step" : undefined} className="relative flex flex-1 flex-col items-center text-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-1/2 top-3 h-px w-full ${number <= current ? "bg-brand" : "bg-line/50"}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 flex size-6 items-center justify-center rounded-full border text-white ${
                done ? "border-brand bg-brand" : active ? "border-brand bg-white" : "border-line/50 bg-white"
              }`}
            >
              {done && <Check className="size-4" />}
            </span>
            <span className={`mt-1 text-[10px] ${active ? "font-semibold text-brand" : "text-muted"}`}>
              <span className="sr-only">{`Step ${number}${done ? ", done" : active ? ", current" : ""}: `}</span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
