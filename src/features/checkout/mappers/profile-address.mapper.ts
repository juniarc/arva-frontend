import type { Profile } from "@/features/profile/types";
import { ADDRESS_LIMITS, addressSchema } from "../schemas/address.schema";
import type { Address } from "../types";

/** The label a copied profile address gets. The profile has no label. */
export const PROFILE_ADDRESS_LABEL = "Home";

export interface ProfileAddressPrefill {
  address: Address;
  /** True when every checkout field is filled in and valid, so it can be saved without asking. */
  complete: boolean;
}

/**
 * The checkout address made from the profile address. The profile has no label, recipient name or
 * digits-only phone, so the label is "Home", the recipient is the profile name, and the phone is the
 * profile phone without its "+". A field that does not fit the checkout rules is left empty for the user.
 */
export function addressFromProfile(profile: Profile): ProfileAddressPrefill | null {
  const { address, user } = profile;
  if (!address) return null;

  const name = user.name.trim();
  const phone = (user.phone ?? "").replace(/^\+/, "");

  const prefilled: Address = {
    label: PROFILE_ADDRESS_LABEL,
    province: address.province,
    city: address.city,
    district: address.district,
    subDistrict: address.subDistrict,
    street: address.street,
    recipientName: name.length <= ADDRESS_LIMITS.recipientName ? name : "",
    phone: addressSchema.shape.phone.safeParse(phone).success ? phone : "",
  };

  return { address: prefilled, complete: addressSchema.safeParse(prefilled).success };
}
