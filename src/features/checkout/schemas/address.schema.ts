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
