import { z } from "zod";
import { EMPTY_FIELD_MESSAGE } from "./shop-edit.schema";

export const OWNER_NAME_LIMIT = 50;
/** An Indonesian national ID (KTP, NIK) has 16 digits. */
export const IC_NUMBER_LENGTH = 16;

const ownerName = z
  .string()
  .trim()
  .min(1, EMPTY_FIELD_MESSAGE)
  .max(OWNER_NAME_LIMIT, `Name must be at most ${OWNER_NAME_LIMIT} characters.`);

const icNumber = z
  .string()
  .trim()
  .min(1, EMPTY_FIELD_MESSAGE)
  .regex(new RegExp(`^\\d{${IC_NUMBER_LENGTH}}$`), `IC number must be exactly ${IC_NUMBER_LENGTH} digits.`);

const identityFields = { ownerName, icNumber };

/**
 * Step 1, Identity Verification. The checkbox starts unchecked and must be checked.
 * These values are checked in the form only: the backend's create endpoint does not take them yet, so they are not sent.
 */
export const identityFormSchema = z.object({
  ...identityFields,
  acceptedTerms: z.boolean().refine((value) => value, "You must agree to the Terms & Conditions."),
});

export type IdentityValues = z.infer<typeof identityFormSchema>;
