/**
 * Region ids in two formats. The region lists (wilayah.id) use dotted codes, for example "31.71.07".
 * The backend keeps the same code as a numeric string without the dots, "317107".
 * The part sizes are fixed (2, 2, 2 and 4 digits), so converting either way loses nothing.
 */

export type RegionCodeLevel = "province" | "city" | "district" | "subDistrict";

const CODE_PARTS: Record<RegionCodeLevel, number[]> = {
  province: [2],
  city: [2, 2],
  district: [2, 2, 2],
  subDistrict: [2, 2, 2, 4],
};

/** "31.71.07" becomes "317107", for the backend. */
export function toNumericId(code: string): string {
  return code.replace(/\./g, "");
}

/** "317107" as a district becomes "31.71.07", for the region lists. An id that is already dotted, or does not fit the level, is returned as it is. */
export function toRegionCode(level: RegionCodeLevel, id: string): string {
  const sizes = CODE_PARTS[level];
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
