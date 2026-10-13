"use client";

import { withRegionChange, type RegionLevel, type RegionSelection } from "@/features/checkout/state/address-regions";
import type { RemoteList } from "@/features/checkout/state/useRemoteList";
import type { Region } from "../types";
import type { RegionLists, RegionValues } from "../state/useRegionLists";
import { INPUT_CLASS, ProfileField } from "./ProfileField";

interface RegionSelectProps {
  id: string;
  label: string;
  what: string;
  /** The level above, for the hint of a disabled select. */
  parentName: string | null;
  value: Region | undefined;
  list: RemoteList<Region>;
  parentChosen: boolean;
  error?: string;
  onChange: (region: Region | undefined) => void;
}

function RegionSelect({ id, label, what, parentName, value, list, parentChosen, error, onChange }: RegionSelectProps) {
  // A saved region stays in the list even before (or without) its options loading.
  const items = value && !list.items.some((item) => item.id === value.id) ? [value, ...list.items] : list.items;
  const hint = parentName && !parentChosen ? `Choose a ${parentName} first.` : undefined;

  return (
    <ProfileField id={id} label={label} mode="edit" error={error} hint={hint}>
      {(aria) => (
        <select
          {...aria}
          value={value?.id ?? ""}
          disabled={!parentChosen || list.status === "unavailable"}
          onChange={(event) => onChange(list.items.find((item) => item.id === event.target.value))}
          className={INPUT_CLASS}
        >
          <option value="">{list.status === "loading" ? "Loading..." : `Select ${what}`}</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      )}
    </ProfileField>
  );
}

interface RegionSelectsProps {
  values: RegionValues;
  lists: RegionLists;
  errors: Partial<Record<RegionLevel, string>>;
  /** The changes to apply: the chosen level, and every level below it cleared. */
  onChange: (selection: RegionSelection) => void;
}

/** Province, city, district and sub-district. Each is disabled until the one above it is chosen. */
export function RegionSelects({ values, lists, errors, onChange }: RegionSelectsProps) {
  const change = (level: RegionLevel) => (region: Region | undefined) => onChange(withRegionChange(level, region));

  return (
    <>
      <RegionSelect
        id="profile-province"
        label="Province"
        what="province"
        parentName={null}
        value={values.province}
        list={lists.provinces}
        parentChosen
        error={errors.province}
        onChange={change("province")}
      />
      <RegionSelect
        id="profile-city"
        label="City"
        what="city"
        parentName="province"
        value={values.city}
        list={lists.cities}
        parentChosen={Boolean(values.province)}
        error={errors.city}
        onChange={change("city")}
      />
      <RegionSelect
        id="profile-district"
        label="District"
        what="district"
        parentName="city"
        value={values.district}
        list={lists.districts}
        parentChosen={Boolean(values.city)}
        error={errors.district}
        onChange={change("district")}
      />
      <RegionSelect
        id="profile-sub-district"
        label="Sub-district"
        what="sub-district"
        parentName="district"
        value={values.subDistrict}
        list={lists.subDistricts}
        parentChosen={Boolean(values.district)}
        error={errors.subDistrict}
        onChange={change("subDistrict")}
      />
    </>
  );
}
