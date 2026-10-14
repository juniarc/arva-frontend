"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/features/products/types";
import { SavingOverlay } from "@/features/profile/components/SavingOverlay";
import { FIELD_CLASS, FormField } from "@/features/shops/components/FormField";
import { ShopFeedback, type ShopNotice } from "@/features/shops/components/ShopFeedback";
import { readSaveFailure } from "@/features/shops/state/save-failure";
import { createProduct, updateProduct } from "../api/product.client";
import { EMPTY_PRODUCT, toCreateRequest, toUpdateRequest, type CreatedProduct } from "../mappers/product-form.mapper";
import {
  PRODUCT_FIELD_ERRORS,
  PRODUCT_LIMITS,
  PRODUCT_SECTION_ERRORS,
  productFormSchema,
  type ProductFormValues,
} from "../schemas/product-form.schema";
import { AdornedInput, digitsOnly } from "./AdornedInput";
import { ProductMediaPicker, type PhotoItem } from "./ProductMediaPicker";
import { TagsInput } from "./TagsInput";
import { VariantFields } from "./VariantFields";

export const INCOMPLETE_MESSAGE = "Please complete the required fields.";
export const UPLOADED_MESSAGE = "Product uploaded.";
export const UPDATED_MESSAGE = "Product updated.";
export const UPLOAD_FAILED_MESSAGE = "Could not upload your product. Please try again.";
export const UPDATE_FAILED_MESSAGE = "Could not save your product. Please try again.";
export const NO_CATEGORIES_MESSAGE = "Categories are not available right now.";
export const NO_PHOTO_MESSAGE = "Add at least one photo.";

type Section = (typeof PRODUCT_SECTION_ERRORS)[number];

/** A new product, or an edit of an existing one (filled in with its values and photos). */
export type ProductFormMode =
  | { kind: "create" }
  | { kind: "edit"; productId: string; values: ProductFormValues; photos: { id: string; url: string }[] };

interface ProductFormProps {
  mode?: ProductFormMode;
  /** Empty when they could not be loaded: the form then says so and cannot be submitted. */
  categories: Category[];
  /** The left button: "Cancel" on its own page, "Skip for now" in the create-shop wizard. */
  secondaryLabel: string;
  onSecondary: () => void;
  onCreated: (product: CreatedProduct) => void;
  /** The id of the page's heading, which names the form. */
  labelledBy: string;
}

const HR = "my-2 border-line/30";

/** "Upload Product": photos, details, variants, discount and shipping, sent in one request. */
export function ProductForm({ mode = { kind: "create" }, categories, secondaryLabel, onSecondary, onCreated, labelledBy }: ProductFormProps) {
  const editing = mode.kind === "edit";
  const [photos, setPhotos] = useState<PhotoItem[]>(() =>
    mode.kind === "edit" ? mode.photos.map((photo) => ({ id: `saved-${photo.id}`, url: photo.url, existingId: photo.id })) : [],
  );
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<Section, string>>>({});
  const [notice, setNotice] = useState<ShopNotice | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    // Checked on Submit, then again on blur.
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: mode.kind === "edit" ? mode.values : EMPTY_PRODUCT,
  });
  const {
    register,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitted },
  } = form;
  const [name, description, tags] = watch(["name", "description", "tags"]);

  const changePhotos = (next: PhotoItem[]) => {
    setPhotos(next);
    setSectionErrors((current) => ({ ...current, images: undefined }));
  };

  const incomplete = () => {
    if (photos.length === 0) setSectionErrors((current) => ({ ...current, images: NO_PHOTO_MESSAGE }));
    setNotice({ kind: "error", message: INCOMPLETE_MESSAGE });
  };

  const submit = form.handleSubmit(async (values) => {
    if (photos.length === 0) {
      incomplete();
      return;
    }
    setNotice(null);
    setSectionErrors({});
    setSaving(true);
    const newFiles = photos.flatMap((photo) => (photo.file ? [photo.file] : []));
    const result =
      mode.kind === "edit"
        ? await updateProduct(
            mode.productId,
            toUpdateRequest(values, photos.flatMap((photo) => (photo.existingId ? [photo.existingId] : []))),
            newFiles,
          )
        : await createProduct(toCreateRequest(values), newFiles);
    setSaving(false);

    if (result.ok) {
      setDone(true);
      setNotice({ kind: "success", message: editing ? UPDATED_MESSAGE : UPLOADED_MESSAGE });
      onCreated(result.data);
      return;
    }

    const { fieldErrors, banner } = readSaveFailure(
      result,
      [...PRODUCT_FIELD_ERRORS, ...PRODUCT_SECTION_ERRORS],
      editing ? UPDATE_FAILED_MESSAGE : UPLOAD_FAILED_MESSAGE,
    );
    const sections: Partial<Record<Section, string>> = {};
    for (const [field, message] of Object.entries(fieldErrors)) {
      if ((PRODUCT_SECTION_ERRORS as readonly string[]).includes(field)) sections[field as Section] = message;
      else setError(field as (typeof PRODUCT_FIELD_ERRORS)[number], { type: "server", message });
    }
    setSectionErrors(sections);
    if (banner) setNotice({ kind: "error", message: banner });
  }, incomplete);

  const noCategories = categories.length === 0;

  return (
    <form onSubmit={submit} noValidate aria-labelledby={labelledBy} className="relative mx-auto max-w-2xl lg:mx-0">
      <ShopFeedback notice={notice} onClose={() => setNotice(null)} />
      <fieldset disabled={saving || done} className="m-0 min-w-0 border-0 p-0">
        <ProductMediaPicker photos={photos} onChange={changePhotos} error={sectionErrors.images} disabled={saving || done} />

        <FormField
          id="product-name"
          label="Product Name"
          error={errors.name?.message}
          counter={{ length: name?.length ?? 0, max: PRODUCT_LIMITS.name }}
        >
          {(aria) => <input {...aria} maxLength={PRODUCT_LIMITS.name} className={FIELD_CLASS} {...register("name")} />}
        </FormField>

        <FormField
          id="product-description"
          label="Product Description"
          error={errors.description?.message}
          counter={{ length: description?.length ?? 0, max: PRODUCT_LIMITS.description }}
        >
          {(aria) => (
            <textarea {...aria} rows={5} maxLength={PRODUCT_LIMITS.description} className={`${FIELD_CLASS} py-2`} {...register("description")} />
          )}
        </FormField>

        {noCategories && <Alert variant="error" message={NO_CATEGORIES_MESSAGE} className="my-2" />}
        <FormField id="product-category" label="Category" error={errors.categoryId?.message}>
          {(aria) => (
            <select {...aria} disabled={noCategories} className={FIELD_CLASS} {...register("categoryId")}>
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <TagsInput
          id="product-tags"
          label="Tags / Keywords"
          value={tags ?? []}
          onChange={(next) => setValue("tags", next, { shouldValidate: isSubmitted })}
          error={sectionErrors.tags ?? errors.tags?.message}
        />

        <hr className={HR} />
        <VariantFields form={form} error={sectionErrors.variants} />

        <FormField id="product-discount" label="Discount (%)" hint="Optional. Taken off the price of every variant." error={errors.discountPercent?.message}>
          {(aria) => (
            <AdornedInput suffix="%">
              <input {...aria} inputMode="numeric" maxLength={2} className={`${FIELD_CLASS} pr-11`} {...register("discountPercent", digitsOnly)} />
            </AdornedInput>
          )}
        </FormField>

        <hr className={HR} />
        <fieldset aria-describedby={sectionErrors.shipping ? "shipping-error" : undefined} className="m-0 min-w-0 border-0 p-0">
          <legend className="p-0 pt-2 text-sm font-bold text-ink">Shipping Fee</legend>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <FormField id="product-weight" label="Package Weight" error={errors.weightGrams?.message}>
              {(aria) => (
                <AdornedInput suffix="g">
                  <input {...aria} inputMode="numeric" className={`${FIELD_CLASS} pr-11`} {...register("weightGrams", digitsOnly)} />
                </AdornedInput>
              )}
            </FormField>
            <FormField id="product-width" label="Package Width" error={errors.widthCm?.message}>
              {(aria) => (
                <AdornedInput suffix="cm">
                  <input {...aria} inputMode="numeric" className={`${FIELD_CLASS} pr-11`} {...register("widthCm", digitsOnly)} />
                </AdornedInput>
              )}
            </FormField>
            <FormField id="product-length" label="Package Length" error={errors.lengthCm?.message}>
              {(aria) => (
                <AdornedInput suffix="cm">
                  <input {...aria} inputMode="numeric" className={`${FIELD_CLASS} pr-11`} {...register("lengthCm", digitsOnly)} />
                </AdornedInput>
              )}
            </FormField>
            <FormField id="product-height" label="Package Height" error={errors.heightCm?.message}>
              {(aria) => (
                <AdornedInput suffix="cm">
                  <input {...aria} inputMode="numeric" className={`${FIELD_CLASS} pr-11`} {...register("heightCm", digitsOnly)} />
                </AdornedInput>
              )}
            </FormField>
          </div>
          <FormField id="product-shipping-fee" label="Shipping Fee" error={errors.shippingFee?.message}>
            {(aria) => (
              <AdornedInput prefix="Rp.">
                <input {...aria} inputMode="numeric" className={`${FIELD_CLASS} pl-11`} {...register("shippingFee", digitsOnly)} />
              </AdornedInput>
            )}
          </FormField>
          {sectionErrors.shipping && (
            <p id="shipping-error" className="text-xs text-danger">
              {sectionErrors.shipping}
            </p>
          )}
        </fieldset>

        <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-line/30 bg-white px-4 py-3 lg:static lg:mx-0 lg:border-0 lg:px-0">
          <Button variant="outline" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
          <Button type="submit" variant="brand" disabled={noCategories}>
            {editing ? "Edit" : "Submit"}
          </Button>
        </div>
      </fieldset>
      {saving && <SavingOverlay />}
    </form>
  );
}
