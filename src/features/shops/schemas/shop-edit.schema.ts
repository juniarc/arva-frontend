import { z } from "zod";
import { profileInfoFormSchema, profileInfoRequestSchema } from "@/features/profile/schemas/profile.schema";
import { addressSchema } from "@/features/checkout/schemas/address.schema";

export const EMPTY_FIELD_MESSAGE = "Field cannot be empty.";
export const SHOP_LIMITS = { nameMin: 3, nameMax: 50 } as const;
export const STREET_LIMIT = 200;

const name = z
  .string()
  .trim()
  .min(1, EMPTY_FIELD_MESSAGE)
  .min(SHOP_LIMITS.nameMin, `Shop name must be at least ${SHOP_LIMITS.nameMin} characters.`)
  .max(SHOP_LIMITS.nameMax, `Shop name must be at most ${SHOP_LIMITS.nameMax} characters.`);

const regionId = (what: string) => z.string({ required_error: `Select a ${what}` }).trim().min(1, `Select a ${what}`).max(20);

// The street, email and phone follow the same rules as the profile and checkout forms.
const street = addressSchema.shape.street;
const email = profileInfoFormSchema.shape.email;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time like 09:00.");

const channelIds = z
  .array(z.string().min(1).max(20), { required_error: "Choose at least one shipping channel." })
  .min(1, "Choose at least one shipping channel.")
  .max(20);

type Hours = { openingTime: string; closingTime: string };

/** Overnight hours (closing on the next day) are not supported, so closing must be later than opening. */
export function closingAfterOpening(values: Hours, context: z.RefinementCtx) {
  if (values.closingTime <= values.openingTime) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["closingTime"], message: "Closing time must be later than opening time." });
  }
}

/** The shop's own fields, shared by the edit form and the create wizard. */
export const shopInfoFields = {
  name,
  provinceId: regionId("province"),
  cityId: regionId("city"),
  districtId: regionId("district"),
  subDistrictId: regionId("sub-district"),
  street,
  shippingChannelIds: channelIds,
  email,
  openingTime: time,
  closingTime: time,
};

/** The edit form. An empty phone means "no phone number". */
export const shopEditFormSchema = z
  .object({ ...shopInfoFields, phone: profileInfoFormSchema.shape.phone })
  .superRefine(closingAfterOpening);

/** The body of PUT /api/shops/me, checked on the server before the backend sees it. */
export const shopEditRequestSchema = z
  .object({ ...shopInfoFields, phone: profileInfoRequestSchema.shape.phone })
  .strict()
  .superRefine(closingAfterOpening);

export type ShopEditValues = z.infer<typeof shopEditFormSchema>;
export type ShopEditRequest = z.infer<typeof shopEditRequestSchema>;

/** The fields that can come back with a field-level message. */
export const SHOP_EDIT_FIELDS = [...Object.keys(shopInfoFields), "phone"] as readonly string[];
