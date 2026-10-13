"use client";

import { getCities, getDistricts, getProvinces, getSubDistricts } from "@/features/checkout/api/checkout.client";
import { useRemoteList, type RemoteList } from "@/features/checkout/state/useRemoteList";
import type { Region } from "../types";

export interface RegionValues {
  province?: Region;
  city?: Region;
  district?: Region;
  subDistrict?: Region;
}

export interface RegionLists {
  provinces: RemoteList<Region>;
  cities: RemoteList<Region>;
  districts: RemoteList<Region>;
  subDistricts: RemoteList<Region>;
  /** A region endpoint answered 404: the options are not available yet. */
  unavailable: boolean;
}

/**
 * The four region lists of the address form. Each loads once the one above it has a value,
 * and an existing address chooses them all at once.
 */
export function useRegionLists({ province, city, district }: RegionValues): RegionLists {
  const provinces = useRemoteList(getProvinces, "provinces");
  const cities = useRemoteList(province ? () => getCities(province.id) : null, `cities-${province?.id}`);
  const districts = useRemoteList(city ? () => getDistricts(city.id) : null, `districts-${city?.id}`);
  const subDistricts = useRemoteList(district ? () => getSubDistricts(district.id) : null, `subs-${district?.id}`);

  const unavailable = [provinces, cities, districts, subDistricts].some((list) => list.status === "unavailable");
  return { provinces, cities, districts, subDistricts, unavailable };
}
