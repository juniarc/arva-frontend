import { Button } from "@/components/ui/Button";

interface WizardButtonsProps {
  /** Step 1 has nowhere to go back to, so Back is disabled there (as in the design). */
  backDisabled?: boolean;
  nextDisabled?: boolean;
  onBack: () => void;
}

/** Back and Next. Next submits the form it is in. A sticky bar below 1024px, plain buttons from 1024px. */
export function WizardButtons({ backDisabled = false, nextDisabled = false, onBack }: WizardButtonsProps) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-line/30 bg-white px-4 py-3 lg:static lg:mx-0 lg:max-w-md lg:border-0 lg:px-0">
      <Button variant="outline" onClick={onBack} disabled={backDisabled}>
        Back
      </Button>
      <Button type="submit" variant="brand" disabled={nextDisabled}>
        Next
      </Button>
    </div>
  );
}
