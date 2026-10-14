import type { RegionLevel, RegionSelection } from "@/features/checkout/state/address-regions";
import { toNumericId, toRegionCode as toRegionCodeAt, type RegionCodeLevel } from "@/lib/region-code";
import type { Region } from "../types";

export type RegionField = "provinceId" | "cityId" | "districtId" | "subDistrictId";

export const REGION_FIELD: Record<RegionLevel, RegionField> = {
  province: "provinceId",
  city: "cityId",
  district: "districtId",
  subDistrict: "subDistrictId",
};

/** What a level's id is when nothing is chosen. */
export const NO_REGION = "";

/**
 * The form changes for a region selection: the chosen level gets its id, and every level below it
 * (a city belongs to one province, and so on) is cleared to an empty id.
 */
export function toIdChanges(selection: RegionSelection): Partial<Record<RegionField, string>> {
  const changes: Partial<Record<RegionField, string>> = {};
  for (const [level, region] of Object.entries(selection) as [RegionLevel, Region | undefined][]) {
    changes[REGION_FIELD[level]] = region?.id ?? NO_REGION;
  }
  return changes;
}

/** The lists load by id, so a saved id is enough to start loading. The name is filled in by the list. */
export function regionFromId(id: string): Region | undefined {
  return id === NO_REGION ? undefined : { id, name: "" };
}

const LEVEL_OF: Record<RegionField, RegionCodeLevel> = {
  provinceId: "province",
  cityId: "city",
  districtId: "district",
  subDistrictId: "subDistrict",
};

export { toNumericId };

/** The backend's numeric id of a field as the region lists' dotted code. See lib/region-code.ts. */
export function toRegionCode(field: RegionField, id: string): string {
  return toRegionCodeAt(LEVEL_OF[field], id);
}
