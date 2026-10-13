"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import type { RegionLevel, RegionSelection } from "@/features/checkout/state/address-regions";
import {
  ADDRESS_LIMITS,
  PROFILE_ADDRESS_FIELDS,
  ZIP_CODE_LENGTH,
  profileAddressFormSchema,
  type ProfileAddressValues,
} from "../schemas/profile-address.schema";
import { useRegionLists } from "../state/useRegionLists";
import type { SaveOutcome } from "../state/useProfileState";
import type { ProfileAddress, Region } from "../types";
import { INPUT_CLASS, ProfileField, ProfileFieldList } from "./ProfileField";
import { RegionSelects } from "./RegionSelects";
import { SavingOverlay } from "./SavingOverlay";
import { SectionHeader } from "./SectionHeader";

export const UNAVAILABLE_MESSAGE = "Address options are not available yet.";

const HEADER_TEXT = {
  title: "Address",
  headingId: "profile-address-heading",
  editText: "Edit Address",
  editLabel: "Edit address",
  cancelLabel: "Cancel editing address",
  saveLabel: "Save address",
};

interface AddressSectionProps {
  address: ProfileAddress | null;
  editing: boolean;
  saving: boolean;
  busy: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (values: ProfileAddressValues) => Promise<SaveOutcome>;
}

type AddressField = (typeof PROFILE_ADDRESS_FIELDS)[number];

function AddressEditor({ address, busy, onCancel, onSave }: Pick<AddressSectionProps, "address" | "busy" | "onCancel" | "onSave">) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<ProfileAddressValues>({
    resolver: zodResolver(profileAddressFormSchema),
    // Checked on Save, then again on blur.
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: address ?? { street: "", zipCode: "" },
  });

  const [street, province, city, district, subDistrict] = watch(["street", "province", "city", "district", "subDistrict"]);
  const lists = useRegionLists({ province, city, district });

  const changeRegions = (selection: RegionSelection) => {
    for (const [level, region] of Object.entries(selection) as [RegionLevel, Region | undefined][]) {
      // `undefined` clears a level. The form type says "required", so the cast is only for clearing.
      setValue(level, region as Region, { shouldValidate: isSubmitted });
    }
  };

  const submit = handleSubmit(async (values) => {
    const outcome = await onSave(values);
    if (outcome.ok) return;
    for (const [field, message] of Object.entries(outcome.fieldErrors)) {
      setError(field as AddressField, { type: "server", message });
    }
  });

  return (
    <form onSubmit={submit} noValidate aria-labelledby={HEADER_TEXT.headingId}>
      <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
        <SectionHeader {...HEADER_TEXT} editing busy={busy} saveDisabled={lists.unavailable} onEdit={() => undefined} onCancel={onCancel} />
        {lists.unavailable && <Alert variant="error" message={UNAVAILABLE_MESSAGE} className="mt-3" />}
        <ProfileFieldList editing>
          <ProfileField
            id="profile-street"
            label="Address Street"
            mode="edit"
            error={errors.street?.message}
            counter={{ length: street?.length ?? 0, max: ADDRESS_LIMITS.street }}
          >
            {(aria) => <textarea {...aria} rows={3} maxLength={ADDRESS_LIMITS.street} className={`${INPUT_CLASS} py-2`} {...register("street")} />}
          </ProfileField>
          <RegionSelects
            values={{ province, city, district, subDistrict }}
            lists={lists}
            errors={{
              province: errors.province?.message,
              city: errors.city?.message,
              district: errors.district?.message,
              subDistrict: errors.subDistrict?.message,
            }}
            onChange={changeRegions}
          />
          <ProfileField id="profile-zip" label="Zip Code" mode="edit" error={errors.zipCode?.message}>
            {(aria) => (
              <input
                {...aria}
                inputMode="numeric"
                maxLength={ZIP_CODE_LENGTH}
                autoComplete="postal-code"
                className={INPUT_CLASS}
                {...register("zipCode", {
                  // Letters are removed as the user types.
                  onChange: (event: { target: HTMLInputElement }) => {
                    event.target.value = event.target.value.replace(/\D/g, "");
                  },
                })}
              />
            )}
          </ProfileField>
        </ProfileFieldList>
      </fieldset>
    </form>
  );
}

export function AddressSection({ address, editing, saving, busy, onEdit, onCancel, onSave }: AddressSectionProps) {
  return (
    <section aria-labelledby={HEADER_TEXT.headingId} className="relative">
      {editing ? (
        <AddressEditor address={address} busy={busy} onCancel={onCancel} onSave={onSave} />
      ) : (
        <>
          <SectionHeader {...HEADER_TEXT} editing={false} busy={busy} onEdit={onEdit} onCancel={onCancel} />
          {address ? (
            <ProfileFieldList editing={false}>
              <ProfileField id="profile-street" label="Address Street" mode="read" value={address.street} />
              <ProfileField id="profile-sub-district" label="Sub-district" mode="read" value={address.subDistrict.name} />
              <ProfileField id="profile-district" label="District" mode="read" value={address.district.name} />
              <ProfileField id="profile-city" label="City" mode="read" value={address.city.name} />
              <ProfileField id="profile-province" label="Province" mode="read" value={address.province.name} />
              <ProfileField id="profile-zip" label="Zip Code" mode="read" value={address.zipCode} />
            </ProfileFieldList>
          ) : (
            <p className="py-2 text-sm text-muted lg:text-xs">You have not added an address yet.</p>
          )}
        </>
      )}
      {saving && <SavingOverlay />}
    </section>
  );
}
