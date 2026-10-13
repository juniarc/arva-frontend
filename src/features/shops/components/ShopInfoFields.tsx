"use client";

import type { UseFormReturn } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import type { RegionLists } from "@/features/profile/state/useRegionLists";
import { SHOP_LIMITS, STREET_LIMIT, type ShopEditValues } from "../schemas/shop-edit.schema";
import type { RegionField } from "../state/shop-regions";
import type { ShippingChannel } from "../types";
import { FIELD_CLASS, FormField } from "./FormField";
import { ShippingChannelCheckboxes } from "./ShippingChannelCheckboxes";
import { ShopRegionSelects, type RegionIds } from "./ShopRegionSelects";

export const CHANNELS_UNAVAILABLE_MESSAGE = "Shipping channels are not available right now.";

interface ShopInfoFieldsProps {
  form: UseFormReturn<ShopEditValues>;
  /** `null` means the list could not be loaded. */
  channels: ShippingChannel[] | null;
  ids: RegionIds;
  lists: RegionLists;
}

/**
 * The shop's fields in two columns from 1024px (one column below): name, regions and street on the left,
 * shipping channels, contact and hours on the right. Used by the edit form and by step 2 of the create wizard.
 */
export function ShopInfoFields({ form, channels, ids, lists }: ShopInfoFieldsProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors, isSubmitted },
  } = form;
  const [street, channelIds] = watch(["street", "shippingChannelIds"]);

  const changeRegions = (changes: Partial<Record<RegionField, string>>) => {
    for (const [field, value] of Object.entries(changes) as [RegionField, string][]) {
      setValue(field, value, { shouldValidate: isSubmitted });
    }
  };

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
      <div>
        <FormField id="shop-name" label="Shop Name" error={errors.name?.message}>
          {(aria) => (
            <input {...aria} maxLength={SHOP_LIMITS.nameMax} autoComplete="organization" className={FIELD_CLASS} {...register("name")} />
          )}
        </FormField>
        <ShopRegionSelects
          ids={ids}
          lists={lists}
          errors={{
            provinceId: errors.provinceId?.message,
            cityId: errors.cityId?.message,
            districtId: errors.districtId?.message,
            subDistrictId: errors.subDistrictId?.message,
          }}
          onChange={changeRegions}
        />
        <FormField
          id="shop-street"
          label="Address Street"
          error={errors.street?.message}
          counter={{ length: street?.length ?? 0, max: STREET_LIMIT }}
        >
          {(aria) => <textarea {...aria} rows={4} maxLength={STREET_LIMIT} className={`${FIELD_CLASS} py-2`} {...register("street")} />}
        </FormField>
      </div>

      <div>
        {channels ? (
          <ShippingChannelCheckboxes
            channels={channels}
            selectedIds={channelIds ?? []}
            error={errors.shippingChannelIds?.message}
            onChange={(selected) => setValue("shippingChannelIds", selected, { shouldValidate: isSubmitted })}
          />
        ) : (
          <Alert variant="error" message={CHANNELS_UNAVAILABLE_MESSAGE} className="my-2" />
        )}
        <FormField id="shop-email" label="Email" error={errors.email?.message}>
          {(aria) => <input {...aria} type="email" autoComplete="email" className={FIELD_CLASS} {...register("email")} />}
        </FormField>
        <FormField id="shop-phone" label="Phone Number" error={errors.phone?.message}>
          {(aria) => <input {...aria} type="tel" inputMode="tel" autoComplete="tel" className={FIELD_CLASS} {...register("phone")} />}
        </FormField>

        <p className="mt-3 text-sm font-bold text-ink">Operational Hours</p>
        <FormField id="shop-opening" label="Opening Hours" error={errors.openingTime?.message}>
          {(aria) => <input {...aria} type="time" className={FIELD_CLASS} {...register("openingTime")} />}
        </FormField>
        <FormField id="shop-closing" label="Closing Hours" error={errors.closingTime?.message}>
          {(aria) => <input {...aria} type="time" className={FIELD_CLASS} {...register("closingTime")} />}
        </FormField>
      </div>
    </div>
  );
}
