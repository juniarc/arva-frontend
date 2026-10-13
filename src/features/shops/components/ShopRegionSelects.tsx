"use client";

import { withRegionChange, type RegionLevel } from "@/features/checkout/state/address-regions";
import type { RemoteList } from "@/features/checkout/state/useRemoteList";
import type { RegionLists } from "@/features/profile/state/useRegionLists";
import { NO_REGION, REGION_FIELD, toIdChanges, type RegionField } from "../state/shop-regions";
import type { Region } from "../types";
import { FIELD_CLASS, FormField } from "./FormField";

interface RegionSelectProps {
  id: string;
  label: string;
  what: string;
  /** The level above, for the hint of a disabled select. */
  parentName: string | null;
  value: string;
  list: RemoteList<Region>;
  parentChosen: boolean;
  error?: string;
  onChange: (id: string) => void;
}

function RegionSelect({ id, label, what, parentName, value, list, parentChosen, error, onChange }: RegionSelectProps) {
  const hint = parentName && !parentChosen ? `Choose a ${parentName} first.` : undefined;

  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      {(aria) => (
        <select
          {...aria}
          value={value}
          disabled={!parentChosen || list.status === "unavailable"}
          onChange={(event) => onChange(event.target.value)}
          className={FIELD_CLASS}
        >
          <option value={NO_REGION}>{list.status === "loading" ? "Loading..." : `Select ${what}`}</option>
          {list.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}

export type RegionIds = Record<RegionField, string>;

interface ShopRegionSelectsProps {
  ids: RegionIds;
  lists: RegionLists;
  errors: Partial<Record<RegionField, string>>;
  /** The changes to apply: the chosen level, and every level below it cleared. */
  onChange: (changes: Partial<Record<RegionField, string>>) => void;
}

/** Province, city, district and sub-district. Each is disabled until the one above it is chosen. */
export function ShopRegionSelects({ ids, lists, errors, onChange }: ShopRegionSelectsProps) {
  const change = (level: RegionLevel) => (id: string) => {
    const list = { province: lists.provinces, city: lists.cities, district: lists.districts, subDistrict: lists.subDistricts }[level];
    onChange(toIdChanges(withRegionChange(level, list.items.find((item) => item.id === id))));
  };

  return (
    <>
      <RegionSelect
        id="shop-province"
        label="Province"
        what="province"
        parentName={null}
        value={ids.provinceId}
        list={lists.provinces}
        parentChosen
        error={errors[REGION_FIELD.province]}
        onChange={change("province")}
      />
      <RegionSelect
        id="shop-city"
        label="City"
        what="city"
        parentName="province"
        value={ids.cityId}
        list={lists.cities}
        parentChosen={ids.provinceId !== NO_REGION}
        error={errors[REGION_FIELD.city]}
        onChange={change("city")}
      />
      <RegionSelect
        id="shop-district"
        label="District"
        what="district"
        parentName="city"
        value={ids.districtId}
        list={lists.districts}
        parentChosen={ids.cityId !== NO_REGION}
        error={errors[REGION_FIELD.district]}
        onChange={change("district")}
      />
      <RegionSelect
        id="shop-sub-district"
        label="Sub-district"
        what="sub-district"
        parentName="district"
        value={ids.subDistrictId}
        list={lists.subDistricts}
        parentChosen={ids.districtId !== NO_REGION}
        error={errors[REGION_FIELD.subDistrict]}
        onChange={change("subDistrict")}
      />
    </>
  );
}
