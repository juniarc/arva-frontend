"use client";

import { Plus, X } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { FIELD_CLASS, FormField } from "@/features/shops/components/FormField";
import { PRODUCT_LIMITS, PRODUCT_UNITS, type ProductFormValues } from "../schemas/product-form.schema";
import { AdornedInput, digitsOnly } from "./AdornedInput";

interface VariantFieldsProps {
  form: UseFormReturn<ProductFormValues>;
  /** A message for the whole list, from the server. */
  error?: string;
}

/**
 * The product's variants (for example "1 kg" and "500 g"), each with its own price, stock and unit.
 * The design shows one; a seller can add up to 10. The first one is the default on the product page.
 */
export function VariantFields({ form, error }: VariantFieldsProps) {
  const { control, register, formState } = form;
  // The variants carry their own `id` (the saved variant), so the list keys use another name.
  const { fields, append, remove } = useFieldArray({ control, name: "variants", keyName: "key" });
  const listError = error ?? formState.errors.variants?.message ?? formState.errors.variants?.root?.message;

  return (
    <fieldset aria-describedby={listError ? "variants-error" : undefined} className="m-0 min-w-0 border-0 py-2">
      <legend className="p-0 text-sm font-bold text-ink">Variants</legend>

      <ol className="mt-2 space-y-3">
        {fields.map((field, index) => {
          const errors = formState.errors.variants?.[index];
          const number = index + 1;
          return (
            <li key={field.key} className="relative rounded-md border border-line/30 p-3">
              <p className="text-xs font-semibold text-ink">Variant {number}</p>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove variant ${number}`}
                  className="absolute right-1 top-1 flex size-11 items-center justify-center text-muted focus-visible:outline-2 focus-visible:outline-info lg:size-8"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
              <FormField id={`variant-${index}-label`} label="Variant Label" error={errors?.label?.message}>
                {(aria) => (
                  <input
                    {...aria}
                    maxLength={PRODUCT_LIMITS.variantLabel}
                    placeholder="e.g. 1 kg"
                    className={FIELD_CLASS}
                    {...register(`variants.${index}.label`)}
                  />
                )}
              </FormField>
              <div className="grid gap-x-3 sm:grid-cols-3">
                <FormField id={`variant-${index}-price`} label="Price" error={errors?.price?.message}>
                  {(aria) => (
                    <AdornedInput prefix="Rp.">
                      <input {...aria} inputMode="numeric" className={`${FIELD_CLASS} pl-11`} {...register(`variants.${index}.price`, digitsOnly)} />
                    </AdornedInput>
                  )}
                </FormField>
                <FormField id={`variant-${index}-stock`} label="Stock" error={errors?.stock?.message}>
                  {(aria) => <input {...aria} inputMode="numeric" className={FIELD_CLASS} {...register(`variants.${index}.stock`, digitsOnly)} />}
                </FormField>
                <FormField id={`variant-${index}-unit`} label="Unit" error={errors?.unit?.message}>
                  {(aria) => (
                    <select {...aria} className={FIELD_CLASS} {...register(`variants.${index}.unit`)}>
                      {PRODUCT_UNITS.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  )}
                </FormField>
              </div>
            </li>
          );
        })}
      </ol>

      {fields.length < PRODUCT_LIMITS.variants && (
        <button
          type="button"
          onClick={() => append({ label: "", price: "", stock: "", unit: "kg" })}
          className="mt-2 flex min-h-11 items-center gap-1 text-sm font-bold text-brand underline focus-visible:outline-2 focus-visible:outline-info lg:min-h-8"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Variant
        </button>
      )}
      {listError && (
        <p id="variants-error" className="mt-1 text-xs text-danger">
          {listError}
        </p>
      )}
    </fieldset>
  );
}
