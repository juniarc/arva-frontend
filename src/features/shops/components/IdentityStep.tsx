"use client";

import type { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/Checkbox";
import { IC_NUMBER_LENGTH, OWNER_NAME_LIMIT, type IdentityValues } from "../schemas/create-shop.schema";
import { FIELD_CLASS, FormField } from "./FormField";
import { WizardButtons } from "./WizardButtons";

interface IdentityStepProps {
  form: UseFormReturn<IdentityValues>;
  onNext: () => void;
}

/**
 * Step 1, Identity Verification: the owner's name, the IC number (KTP) and the agreement.
 * The IC number is private: it is not remembered by the browser, and it is sent once when the shop is created.
 */
export function IdentityStep({ form, onNext }: IdentityStepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors, isSubmitted },
  } = form;
  const accepted = watch("acceptedTerms");
  const termsError = errors.acceptedTerms?.message;

  return (
    <form onSubmit={(event) => { event.preventDefault(); onNext(); }} noValidate aria-labelledby="create-shop-heading">
      <div className="lg:max-w-md">
        <FormField id="identity-name" label="Name" error={errors.ownerName?.message}>
          {(aria) => (
            <input {...aria} maxLength={OWNER_NAME_LIMIT} autoComplete="name" placeholder="Name" className={FIELD_CLASS} {...register("ownerName")} />
          )}
        </FormField>

        <FormField id="identity-ic" label="IC Number (KTP)" error={errors.icNumber?.message}>
          {(aria) => (
            <input
              {...aria}
              inputMode="numeric"
              maxLength={IC_NUMBER_LENGTH}
              autoComplete="off"
              className={FIELD_CLASS}
              {...register("icNumber", {
                // Only digits are kept as the user types.
                onChange: (event: { target: HTMLInputElement }) => {
                  event.target.value = event.target.value.replace(/\D/g, "");
                },
              })}
            />
          )}
        </FormField>

        <div className="py-2">
          <label className="flex cursor-pointer items-center gap-1">
            <Checkbox
              label="I agree to these Terms & Conditions."
              checked={accepted}
              onChange={() => setValue("acceptedTerms", !accepted, { shouldValidate: isSubmitted })}
            />
            {/* There is no Terms & Conditions page yet, so this is styled like a link but is not one. */}
            <span aria-hidden="true" className="text-xs text-ink">
              I agree to these <span className="text-info underline">Terms &amp; Conditions.</span>
            </span>
          </label>
          {termsError && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {termsError}
            </p>
          )}
        </div>
      </div>

      <WizardButtons backDisabled onBack={() => undefined} />
    </form>
  );
}
