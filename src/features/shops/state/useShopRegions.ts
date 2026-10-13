"use client";

import type { UseFormReturn } from "react-hook-form";
import { useRegionLists, type RegionLists } from "@/features/profile/state/useRegionLists";
import type { ShopEditValues } from "../schemas/shop-edit.schema";
import { regionFromId } from "./shop-regions";
import type { RegionIds } from "../components/ShopRegionSelects";

/** The chosen region ids of a shop form, and the four lists they load (each loads once its parent has a value). */
export function useShopRegions(form: UseFormReturn<ShopEditValues>): { ids: RegionIds; lists: RegionLists } {
  const [provinceId, cityId, districtId, subDistrictId] = form.watch(["provinceId", "cityId", "districtId", "subDistrictId"]);
  const lists = useRegionLists({
    province: regionFromId(provinceId),
    city: regionFromId(cityId),
    district: regionFromId(districtId),
  });
  return { ids: { provinceId, cityId, districtId, subDistrictId }, lists };
}
