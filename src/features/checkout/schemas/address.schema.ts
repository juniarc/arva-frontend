import { z } from "zod";

/** A place from the region endpoints. The id is what the backend knows; the name is what we show. */
export interface Region {
  id: string;
  name: string;
}

const regionField = (what: string) =>
  z.object(
    { id: z.string().min(1), name: z.string().min(1) },
    { required_error: `Select a ${what}`, invalid_type_error: `Select a ${what}` },
  );

/**
 * The address form, and the body of PUT /api/checkout/address. One schema, used by the form in the
 * browser and by the Route Handler on the server.
 */
export const addressSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Address label is required")
    .max(30, "Address label must be at most 30 characters"),
  province: regionField("province"),
  city: regionField("city"),
  district: regionField("district"),
  subDistrict: regionField("sub-district"),
  street: z
    .string()
    .trim()
    .min(1, "Address street is required")
    .max(200, "Address street must be at most 200 characters"),
  recipientName: z
    .string()
    .trim()
    .min(1, "Recipient's name is required")
    .max(30, "Recipient's name must be at most 30 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d+$/, "Phone number can only contain digits")
    .min(8, "Phone number must be at least 8 digits")
    .max(15, "Phone number must be at most 15 digits"),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const ADDRESS_LIMITS = { label: 30, street: 200, recipientName: 30, phone: 15 } as const;

const regionIdOnly = z.object({ id: z.string().regex(/^\d{1,10}$/, "Select a region") }).strict();

/**
 * The body the backend takes for PUT /checkout/address: region ids only, as numeric strings without the dots
 * ("31.71" is "3171"), and no region names. Checked by our proxy before the backend sees it.
 */
export const checkoutAddressRequestSchema = z
  .object({
    label: addressSchema.shape.label,
    province: regionIdOnly,
    city: regionIdOnly,
    district: regionIdOnly,
    subDistrict: regionIdOnly,
    street: addressSchema.shape.street,
    recipientName: addressSchema.shape.recipientName,
    phone: addressSchema.shape.phone,
  })
  .strict();

export type CheckoutAddressRequest = z.infer<typeof checkoutAddressRequestSchema>;
