"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SavingOverlay } from "@/features/profile/components/SavingOverlay";
import { updateMyShop } from "../api/shop.client";
import { toEditRequest, toEditValues } from "../mappers/shop.mapper";
import { SHOP_EDIT_FIELDS, shopEditFormSchema, type ShopEditValues } from "../schemas/shop-edit.schema";
import { readSaveFailure } from "../state/save-failure";
import { useShopRegions } from "../state/useShopRegions";
import type { MyShop, ShippingChannel } from "../types";
import { CHANNELS_UNAVAILABLE_MESSAGE, ShopInfoFields } from "./ShopInfoFields";
import { ShopFeedback, type ShopNotice } from "./ShopFeedback";

export { CHANNELS_UNAVAILABLE_MESSAGE };
export const SAVED_MESSAGE = "Shop information updated.";
export const FAILED_MESSAGE = "Could not save your shop. Please try again.";
export const REGIONS_UNAVAILABLE_MESSAGE = "Address options are not available yet.";
/** How long the success message shows before the page goes back to the shop. */
export const REDIRECT_DELAY_MS = 1_500;

interface ShopEditFormProps {
  /** Loaded on the server. The form does not fetch anything when it opens (except the region lists). */
  shop: MyShop;
  /** `null` means the list could not be loaded. */
  channels: ShippingChannel[] | null;
}

type FieldName = keyof ShopEditValues;

export function ShopEditForm({ shop, channels }: ShopEditFormProps) {
  const router = useRouter();
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<ShopNotice | null>(null);

  const form = useForm<ShopEditValues>({
    resolver: zodResolver(shopEditFormSchema),
    // Checked on Save, then again on blur.
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: toEditValues(shop),
  });
  const { ids, lists } = useShopRegions(form);

  const shopHref = `/shops/${savedSlug ?? shop.slug}`;

  // After a save, go back to the shop once the message has been seen.
  useEffect(() => {
    if (!savedSlug) return;
    const timer = setTimeout(() => router.push(`/shops/${savedSlug}`), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [savedSlug, router]);

  const submit = form.handleSubmit(async (values) => {
    setNotice(null);
    setSaving(true);
    const result = await updateMyShop(toEditRequest(values));
    setSaving(false);

    if (result.ok) {
      setNotice({ kind: "success", message: SAVED_MESSAGE });
      setSavedSlug(result.data.slug);
      return;
    }

    const { fieldErrors, banner } = readSaveFailure(result, SHOP_EDIT_FIELDS, FAILED_MESSAGE);
    for (const [field, message] of Object.entries(fieldErrors)) form.setError(field as FieldName, { type: "server", message });
    if (banner) setNotice({ kind: "error", message: banner });
  });

  const saveBlocked = channels === null || lists.unavailable;

  return (
    <form onSubmit={submit} noValidate aria-labelledby="shop-edit-heading" className="relative">
      <ShopFeedback notice={notice} onClose={() => setNotice(null)} />
      <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
        <ShopInfoFields form={form} channels={channels} ids={ids} lists={lists} />

        {lists.unavailable && <Alert variant="error" message={REGIONS_UNAVAILABLE_MESSAGE} className="mt-3" />}

        <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-line/30 bg-white px-4 py-3 lg:static lg:mx-0 lg:max-w-md lg:border-0 lg:px-0">
          <Button variant="outline" onClick={() => router.push(shopHref)}>
            {savedSlug ? "Back" : "Cancel"}
          </Button>
          <Button type="submit" variant="brand" disabled={saveBlocked}>
            Save
          </Button>
        </div>
      </fieldset>
      {saving && <SavingOverlay />}
    </form>
  );
}
