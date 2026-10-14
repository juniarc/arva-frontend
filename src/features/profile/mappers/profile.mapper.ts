import { profileResponseSchema, type ProfileInfoRequest, type ProfileInfoValues, type ProfileResponseDto } from "../schemas/profile.schema";
import type { ProfileAddressRequest, ProfileAddressValues } from "../schemas/profile-address.schema";
import { toNumericId, toRegionCode, type RegionCodeLevel } from "@/lib/region-code";
import type { Profile, Region } from "../types";

/** The backend sent something the profile page cannot use. */
export class ProfileMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileMappingError";
  }
}

/** A photo is shown only from an http(s) URL or a path on our own site. */
function safePhotoUrl(value: string | null | undefined): string | null {
  const url = value?.trim();
  if (!url) return null;
  return /^https?:\/\//i.test(url) || (url.startsWith("/") && !url.startsWith("//")) ? url : null;
}

/** The backend's numeric region id as the region lists' dotted code, so the saved region can be chosen again. */
const regionFromBackend = (level: RegionCodeLevel, region: Region): Region => ({ id: toRegionCode(level, region.id), name: region.name });

export function toProfile(dto: ProfileResponseDto): Profile {
  const { address } = dto;
  return {
    user: {
      username: dto.user.username,
      name: dto.user.name,
      email: dto.user.email,
      phone: dto.user.phone?.trim() || null,
      photoUrl: safePhotoUrl(dto.user.photoUrl),
    },
    address: address
      ? {
          street: address.street,
          province: regionFromBackend("province", address.province),
          city: regionFromBackend("city", address.city),
          district: regionFromBackend("district", address.district),
          subDistrict: regionFromBackend("subDistrict", address.subDistrict),
          zipCode: address.zipCode,
        }
      : null,
  };
}

/** Throws ProfileMappingError for a response without a user. The result is safe to parse again. */
export function parseProfile(data: unknown): Profile {
  const result = profileResponseSchema.safeParse(data);
  if (!result.success) throw new ProfileMappingError("Unexpected profile response shape.");
  return toProfile(result.data);
}

/** The form holds an empty string for "no phone"; the backend wants null. */
export function toInfoRequest(values: ProfileInfoValues): ProfileInfoRequest {
  const phone = values.phone.trim();
  return {
    name: values.name.trim(),
    username: values.username.trim(),
    email: values.email.trim(),
    phone: phone === "" ? null : phone,
  };
}

/** Only the ids go to the backend, as numeric strings without the dots ("31.71" is "3171"). */
export function toAddressRequest(values: ProfileAddressValues): ProfileAddressRequest {
  return {
    street: values.street.trim(),
    province: { id: toNumericId(values.province.id) },
    city: { id: toNumericId(values.city.id) },
    district: { id: toNumericId(values.district.id) },
    subDistrict: { id: toNumericId(values.subDistrict.id) },
    zipCode: values.zipCode,
  };
}
