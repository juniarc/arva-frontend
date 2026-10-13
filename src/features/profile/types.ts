import type { Region } from "@/features/checkout/types";

export type { Region };

export interface ProfileUser {
  username: string;
  name: string;
  email: string;
  /** Optional leading "+", then 8 to 15 digits. */
  phone: string | null;
  photoUrl: string | null;
}

/** The profile address. It is separate from the checkout draft's address: editing one never changes the other. */
export interface ProfileAddress {
  street: string;
  subDistrict: Region;
  district: Region;
  city: Region;
  province: Region;
  zipCode: string;
}

export interface Profile {
  user: ProfileUser;
  address: ProfileAddress | null;
}

export type ProfileSection = "info" | "address";
