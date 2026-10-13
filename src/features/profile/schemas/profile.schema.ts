import { z } from "zod";

export const EMPTY_FIELD_MESSAGE = "Field cannot be empty.";
export const INVALID_EMAIL_MESSAGE = "Invalid email format.";
export const INVALID_PHONE_MESSAGE = "Invalid phone number format.";

export const PROFILE_LIMITS = { name: 50, usernameMin: 3, usernameMax: 30, email: 254 } as const;

const name = z
  .string()
  .trim()
  .min(1, EMPTY_FIELD_MESSAGE)
  .max(PROFILE_LIMITS.name, `Name must be at most ${PROFILE_LIMITS.name} characters.`);

// Same rule as register: letters, numbers and underscores only.
const username = z
  .string()
  .trim()
  .min(1, EMPTY_FIELD_MESSAGE)
  .min(PROFILE_LIMITS.usernameMin, `Username must be at least ${PROFILE_LIMITS.usernameMin} characters.`)
  .max(PROFILE_LIMITS.usernameMax, `Username must be at most ${PROFILE_LIMITS.usernameMax} characters.`)
  .regex(/^[A-Za-z0-9_]+$/, "Username can only contain letters, numbers and underscores.");

const email = z
  .string()
  .trim()
  .min(1, EMPTY_FIELD_MESSAGE)
  .max(PROFILE_LIMITS.email, `Email must be at most ${PROFILE_LIMITS.email} characters.`)
  .email(INVALID_EMAIL_MESSAGE);

const phone = z.string().trim().regex(/^\+?\d{8,15}$/, INVALID_PHONE_MESSAGE);

/** The Profile Info form. An empty phone means "no phone number". */
export const profileInfoFormSchema = z.object({
  name,
  username,
  email,
  phone: z.union([z.literal(""), phone]),
});

/** The body of PUT /api/profile, checked on the server before the backend sees it. */
export const profileInfoRequestSchema = z.object({ name, username, email, phone: phone.nullable() }).strict();

export type ProfileInfoValues = z.infer<typeof profileInfoFormSchema>;
export type ProfileInfoRequest = z.infer<typeof profileInfoRequestSchema>;

/** The fields of the Profile Info section that can come back with a field-level message. */
export const PROFILE_INFO_FIELDS = ["name", "username", "email", "phone"] as const;

// What the backend answers: the full profile. Ids may arrive as numbers; they are kept as strings.
const text = z.union([z.string(), z.number()]).transform(String);
const regionDto = z.object({ id: text, name: z.string().min(1) });

export const profileResponseSchema = z.object({
  user: z.object({
    username: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullish(),
    photoUrl: z.string().nullish(),
  }),
  address: z
    .object({
      street: z.string(),
      subDistrict: regionDto,
      district: regionDto,
      city: regionDto,
      province: regionDto,
      zipCode: text,
    })
    .nullish(),
});

export type ProfileResponseDto = z.infer<typeof profileResponseSchema>;
