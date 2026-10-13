import { z } from "zod";
import { addressSchema } from "@/features/checkout/schemas/address.schema";

export const ZIP_CODE_LENGTH = 5;
export const ADDRESS_LIMITS = { street: 200 } as const;

// The street and the four regions follow the same rules as the checkout address form.
const { street, province, city, district, subDistrict } = addressSchema.shape;

const zipCode = z
  .string()
  .regex(new RegExp(`^\\d{${ZIP_CODE_LENGTH}}$`), `Zip code must be exactly ${ZIP_CODE_LENGTH} digits.`);

/** The Address form. Each region is `{ id, name }`: the name is shown, the id is what the backend knows. */
export const profileAddressFormSchema = z.object({ street, province, city, district, subDistrict, zipCode });

const regionId = z.object({ id: z.string().min(1) });

/** The body of PUT /api/profile/address: ids only. */
export const profileAddressRequestSchema = z
  .object({
    street,
    subDistrict: regionId,
    district: regionId,
    city: regionId,
    province: regionId,
    zipCode,
  })
  .strict();

export type ProfileAddressValues = z.infer<typeof profileAddressFormSchema>;
export type ProfileAddressRequest = z.infer<typeof profileAddressRequestSchema>;

/** The fields of the Address section that can come back with a field-level message. */
export const PROFILE_ADDRESS_FIELDS = ["street", "province", "city", "district", "subDistrict", "zipCode"] as const;
