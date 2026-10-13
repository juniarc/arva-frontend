import { profileResponseSchema, type ProfileInfoRequest, type ProfileInfoValues, type ProfileResponseDto } from "../schemas/profile.schema";
import type { ProfileAddressRequest, ProfileAddressValues } from "../schemas/profile-address.schema";
import type { Profile } from "../types";

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

export function toProfile(dto: ProfileResponseDto): Profile {
  return {
    user: {
      username: dto.user.username,
      name: dto.user.name,
      email: dto.user.email,
      phone: dto.user.phone?.trim() || null,
      photoUrl: safePhotoUrl(dto.user.photoUrl),
    },
    address: dto.address ?? null,
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

/** Only the ids go to the backend. */
export function toAddressRequest(values: ProfileAddressValues): ProfileAddressRequest {
  return {
    street: values.street.trim(),
    province: { id: values.province.id },
    city: { id: values.city.id },
    district: { id: values.district.id },
    subDistrict: { id: values.subDistrict.id },
    zipCode: values.zipCode,
  };
}
