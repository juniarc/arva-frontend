import type { Region } from "../types";

export type RegionLevel = "province" | "city" | "district" | "subDistrict";
export type RegionSelection = Partial<Record<RegionLevel, Region | undefined>>;

const ORDER: readonly RegionLevel[] = ["province", "city", "district", "subDistrict"];

/**
 * The selections after the user picks (or clears) one level. Every level below it is cleared,
 * because a city belongs to one province, a district to one city, and so on.
 */
export function withRegionChange(level: RegionLevel, region: Region | undefined): RegionSelection {
  const index = ORDER.indexOf(level);
  const result: RegionSelection = {};
  ORDER.forEach((name, position) => {
    if (position === index) result[name] = region;
    if (position > index) result[name] = undefined;
  });
  return result;
}
