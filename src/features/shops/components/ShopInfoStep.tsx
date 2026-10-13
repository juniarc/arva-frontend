"use client";

import type { UseFormReturn } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { SavingOverlay } from "@/features/profile/components/SavingOverlay";
import type { ShopEditValues } from "../schemas/shop-edit.schema";
import { useShopRegions } from "../state/useShopRegions";
import type { ShippingChannel } from "../types";
import { ShopInfoFields } from "./ShopInfoFields";
import { WizardButtons } from "./WizardButtons";

export const REGIONS_UNAVAILABLE_MESSAGE = "Address options are not available yet.";

interface ShopInfoStepProps {
  form: UseFormReturn<ShopEditValues>;
  /** `null` means the list could not be loaded. */
  channels: ShippingChannel[] | null;
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
}

/** Step 2, Shop Information: the same fields as the edit form. Next opens the shop. */
export function ShopInfoStep({ form, channels, saving, onBack, onNext }: ShopInfoStepProps) {
  const { ids, lists } = useShopRegions(form);

  return (
    <form onSubmit={(event) => { event.preventDefault(); onNext(); }} noValidate aria-labelledby="create-shop-heading" className="relative">
      <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
        <ShopInfoFields form={form} channels={channels} ids={ids} lists={lists} />
        {lists.unavailable && <Alert variant="error" message={REGIONS_UNAVAILABLE_MESSAGE} className="mt-3" />}
        <WizardButtons onBack={onBack} nextDisabled={channels === null || lists.unavailable} />
      </fieldset>
      {saving && <SavingOverlay />}
    </form>
  );
}
