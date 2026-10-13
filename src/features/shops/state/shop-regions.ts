import type { RegionLevel, RegionSelection } from "@/features/checkout/state/address-regions";
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

/** How many digits each part of a wilayah.id code has: "31.71.07.1001" is 2, 2, 2 and 4 digits. */
const CODE_PARTS: Record<RegionField, number[]> = {
  provinceId: [2],
  cityId: [2, 2],
  districtId: [2, 2, 2],
  subDistrictId: [2, 2, 2, 4],
};

/**
 * The backend keeps region ids as numeric strings ("31.71.07" is "317107"), while the region lists (wilayah.id)
 * use dotted codes. These two functions convert between them. Nothing is lost: the part sizes are fixed.
 */
export function toNumericId(code: string): string {
  return code.replace(/\./g, "");
}

/** "317107" as a district is "31.71.07". An id that is already dotted, or does not fit the level, is returned as it is. */
export function toRegionCode(field: RegionField, id: string): string {
  const sizes = CODE_PARTS[field];
  if (id.includes(".") || !/^\d+$/.test(id) || id.length !== sizes.reduce((sum, size) => sum + size, 0)) return id;

  let at = 0;
  return sizes
    .map((size) => {
      const part = id.slice(at, at + size);
      at += size;
      return part;
    })
    .join(".");
}
