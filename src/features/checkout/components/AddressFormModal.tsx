"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { getCities, getDistricts, getProvinces, getSubDistricts } from "../api/checkout.client";
import { ADDRESS_LIMITS, addressSchema, type AddressInput } from "../schemas/address.schema";
import { withRegionChange, type RegionLevel } from "../state/address-regions";
import { useRemoteList, type RemoteList } from "../state/useRemoteList";
import type { Address, Region } from "../types";

const FIELD =
  "w-full rounded-sm border border-line/60 bg-white px-3 text-xs text-ink outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger";

function FieldShell({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs text-muted">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** "4/30". The limit message is announced once, when the limit is reached. */
function CharCounter({ id, length, max }: { id: string; length: number; max: number }) {
  return (
    <>
      <p id={id} className="mt-1 text-right text-[10px] text-muted">
        {length}/{max}
      </p>
      <span role="status" className="sr-only">
        {length >= max ? "Character limit reached" : ""}
      </span>
    </>
  );
}

interface RegionSelectProps {
  id: string;
  label: string;
  what: string;
  value: Region | undefined;
  list: RemoteList<Region>;
  /** A select is disabled until the one above it has a value. */
  parentChosen: boolean;
  error?: string;
  onChange: (region: Region | undefined) => void;
}

function RegionSelect({ id, label, what, value, list, parentChosen, error, onChange }: RegionSelectProps) {
  const items = value && !list.items.some((item) => item.id === value.id) ? [value, ...list.items] : list.items;

  return (
    <FieldShell id={id} label={label} error={error}>
      <select
        id={id}
        value={value?.id ?? ""}
        disabled={!parentChosen || list.status === "unavailable"}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(list.items.find((item) => item.id === event.target.value))}
        className={`${FIELD} h-11`}
      >
        <option value="">{list.status === "loading" ? "Loading..." : `Select ${what}`}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface AddressFormProps {
  address: Address | null;
  onSave: (address: AddressInput) => Promise<{ ok: true } | { ok: false; message: string }>;
  onClose: () => void;
}

function AddressForm({ address, onSave, onClose }: AddressFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    mode: "onChange",
    defaultValues: address ?? { label: "", street: "", recipientName: "", phone: "" },
  });

  const [label, street, recipientName, phone] = watch(["label", "street", "recipientName", "phone"]);
  const province = watch("province");
  const city = watch("city");
  const district = watch("district");
  const subDistrict = watch("subDistrict");

  // Each list loads once its parent is chosen. In edit mode the saved address chooses them all at once.
  const provinces = useRemoteList(getProvinces, "provinces");
  const cities = useRemoteList(province ? () => getCities(province.id) : null, `cities-${province?.id}`);
  const districts = useRemoteList(city ? () => getDistricts(city.id) : null, `districts-${city?.id}`);
  const subDistricts = useRemoteList(district ? () => getSubDistricts(district.id) : null, `subs-${district?.id}`);

  const changeRegion = (level: RegionLevel, region: Region | undefined) => {
    const changes = withRegionChange(level, region);
    for (const [name, value] of Object.entries(changes) as [RegionLevel, Region | undefined][]) {
      // `undefined` clears a field. The form type says "required", so the cast is only for clearing.
      setValue(name, value as Region, { shouldValidate: true, shouldDirty: true });
    }
  };

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await onSave(values);
    if (result.ok) onClose();
    else setFormError(result.message);
  });

  /** The ids a field is described by: its counter, and its error when it has one. */
  const describedBy = (id: string, hasError: boolean) => `${id}-count${hasError ? ` ${id}-error` : ""}`;

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
      <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-4">
        {formError && <Alert variant="error" message={formError} />}
        {provinces.status === "unavailable" && (
          <Alert variant="error" message="Address options are not available yet." />
        )}
        {provinces.status === "error" && <Alert variant="error" message="Could not load the address options. Please try again." />}

        <FieldShell id="address-label" label="Address Label" error={errors.label?.message}>
          <input
            id="address-label"
            maxLength={ADDRESS_LIMITS.label}
            autoComplete="off"
            aria-invalid={errors.label ? true : undefined}
            aria-describedby={describedBy("address-label", Boolean(errors.label))}
            className={`${FIELD} h-11`}
            {...register("label")}
          />
          <CharCounter id="address-label-count" length={label?.length ?? 0} max={ADDRESS_LIMITS.label} />
        </FieldShell>

        <RegionSelect
          id="address-province"
          label="Province"
          what="province"
          value={province}
          list={provinces}
          parentChosen
          error={errors.province?.message}
          onChange={(region) => changeRegion("province", region)}
        />
        <RegionSelect
          id="address-city"
          label="City"
          what="city"
          value={city}
          list={cities}
          parentChosen={Boolean(province)}
          error={errors.city?.message}
          onChange={(region) => changeRegion("city", region)}
        />
        <RegionSelect
          id="address-district"
          label="District"
          what="district"
          value={district}
          list={districts}
          parentChosen={Boolean(city)}
          error={errors.district?.message}
          onChange={(region) => changeRegion("district", region)}
        />
        <RegionSelect
          id="address-sub-district"
          label="Sub-district"
          what="sub-district"
          value={subDistrict}
          list={subDistricts}
          parentChosen={Boolean(district)}
          error={errors.subDistrict?.message}
          onChange={(region) => changeRegion("subDistrict", region)}
        />

        <FieldShell id="address-street" label="Address Street" error={errors.street?.message}>
          <textarea
            id="address-street"
            rows={4}
            maxLength={ADDRESS_LIMITS.street}
            aria-invalid={errors.street ? true : undefined}
            aria-describedby={describedBy("address-street", Boolean(errors.street))}
            className={`${FIELD} py-2`}
            {...register("street")}
          />
          <CharCounter id="address-street-count" length={street?.length ?? 0} max={ADDRESS_LIMITS.street} />
        </FieldShell>

        <FieldShell id="address-recipient" label="Recipient's Name" error={errors.recipientName?.message}>
          <input
            id="address-recipient"
            maxLength={ADDRESS_LIMITS.recipientName}
            autoComplete="name"
            aria-invalid={errors.recipientName ? true : undefined}
            aria-describedby={describedBy("address-recipient", Boolean(errors.recipientName))}
            className={`${FIELD} h-11`}
            {...register("recipientName")}
          />
          <CharCounter id="address-recipient-count" length={recipientName?.length ?? 0} max={ADDRESS_LIMITS.recipientName} />
        </FieldShell>

        <FieldShell id="address-phone" label="Phone's Number" error={errors.phone?.message}>
          <input
            id="address-phone"
            type="tel"
            inputMode="numeric"
            maxLength={ADDRESS_LIMITS.phone}
            autoComplete="tel"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy("address-phone", Boolean(errors.phone))}
            className={`${FIELD} h-11`}
            {...register("phone", {
              // Letters are removed as the user types.
              onChange: (event: { target: HTMLInputElement }) => {
                event.target.value = event.target.value.replace(/\D/g, "");
              },
            })}
          />
          <CharCounter id="address-phone-count" length={phone?.length ?? 0} max={ADDRESS_LIMITS.phone} />
        </FieldShell>
      </div>

      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
        <Button type="submit" variant="brand" loading={isSubmitting} disabled={!isValid}>
          Save Address
        </Button>
      </div>
    </form>
  );
}

interface AddressFormModalProps {
  open: boolean;
  /** `null` opens the form empty (create); an address opens it filled in (edit). */
  address: Address | null;
  onSave: AddressFormProps["onSave"];
  onClose: () => void;
}

/** The form is mounted only while the modal is open, so it starts fresh every time. */
export function AddressFormModal({ open, address, onSave, onClose }: AddressFormModalProps) {
  return (
    <ModalShell open={open} title="Address Detail" onClose={onClose}>
      {open && <AddressForm address={address} onSave={onSave} onClose={onClose} />}
    </ModalShell>
  );
}
