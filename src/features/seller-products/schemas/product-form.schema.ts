import { z } from "zod";

/** The rules for listing a product (POST /products). The backend checks the same rules. */

export const PRODUCT_UNITS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "pcs", label: "Piece (pcs)" },
  { value: "l", label: "Liter (l)" },
  { value: "ml", label: "Milliliter (ml)" },
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number]["value"];
const UNIT_VALUES = PRODUCT_UNITS.map((unit) => unit.value) as [ProductUnit, ...ProductUnit[]];

export const PRODUCT_LIMITS = {
  name: 200,
  description: 3000,
  tags: 10,
  tag: 30,
  variants: 10,
  variantLabel: 30,
  photos: 5,
} as const;

const NUMBER_LIMITS = {
  price: { min: 100, max: 1_000_000_000 },
  stock: { min: 0, max: 1_000_000 },
  discount: { min: 1, max: 90 },
  weight: { min: 1, max: 1_000_000 },
  size: { min: 1, max: 1000 },
  fee: { min: 0, max: 100_000_000 },
} as const;

const required = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be at most ${max} characters.`);

/** A number typed into a text field: digits only, within a range. The form keeps it as text. */
const wholeNumber = (label: string, { min, max }: { min: number; max: number }) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .regex(/^\d+$/, `${label} must be a whole number.`)
    .refine((value) => Number(value) >= min, `${label} must be at least ${min.toLocaleString("id-ID")}.`)
    .refine((value) => Number(value) <= max, `${label} must be at most ${max.toLocaleString("id-ID")}.`);

const variantFormSchema = z.object({
  /** The existing variant's id when editing; absent for a new variant. */
  id: z.string().optional(),
  label: required("Variant label", PRODUCT_LIMITS.variantLabel),
  price: wholeNumber("Price", NUMBER_LIMITS.price),
  stock: wholeNumber("Stock", NUMBER_LIMITS.stock),
  unit: z.enum(UNIT_VALUES, { errorMap: () => ({ message: "Choose a unit." }) }),
});

/** The form. Numbers stay as the text the user typed; the mapper turns them into numbers. */
export const productFormSchema = z.object({
  name: required("Product name", PRODUCT_LIMITS.name),
  description: required("Product description", PRODUCT_LIMITS.description),
  categoryId: z.string().min(1, "Choose a category."),
  tags: z.array(z.string()).max(PRODUCT_LIMITS.tags, `Add at most ${PRODUCT_LIMITS.tags} tags.`),
  variants: z
    .array(variantFormSchema)
    .min(1, "Add at least one variant.")
    .max(PRODUCT_LIMITS.variants, `Add at most ${PRODUCT_LIMITS.variants} variants.`)
    .superRefine((variants, context) => {
      const seen = new Set<string>();
      variants.forEach((variant, index) => {
        const key = variant.label.trim().toLowerCase();
        if (key && seen.has(key)) {
          context.addIssue({ code: z.ZodIssueCode.custom, path: [index, "label"], message: "Each variant needs a different label." });
        }
        seen.add(key);
      });
    }),
  discountPercent: z.union([z.literal(""), wholeNumber("Discount", NUMBER_LIMITS.discount)]),
  weightGrams: wholeNumber("Package weight", NUMBER_LIMITS.weight),
  widthCm: wholeNumber("Package width", NUMBER_LIMITS.size),
  lengthCm: wholeNumber("Package length", NUMBER_LIMITS.size),
  heightCm: wholeNumber("Package height", NUMBER_LIMITS.size),
  shippingFee: wholeNumber("Shipping fee", NUMBER_LIMITS.fee),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

const int = ({ min, max }: { min: number; max: number }) => z.number().int().min(min).max(max);

const variantRequest = z
  .object({
    label: required("Variant label", PRODUCT_LIMITS.variantLabel),
    price: int(NUMBER_LIMITS.price),
    stock: int(NUMBER_LIMITS.stock),
    unit: z.enum(UNIT_VALUES),
  })
  .strict();

const numericId = z.string().regex(/^\d{1,9}$/);

/** The JSON in the "data" field of POST /api/products, checked by our proxy before the backend sees it. */
export const productCreateRequestSchema = z
  .object({
    name: required("Product name", PRODUCT_LIMITS.name),
    description: required("Product description", PRODUCT_LIMITS.description),
    categoryId: z.string().regex(/^\d{1,9}$/),
    tags: z.array(required("Tag", PRODUCT_LIMITS.tag)).max(PRODUCT_LIMITS.tags),
    variants: z.array(variantRequest).min(1).max(PRODUCT_LIMITS.variants),
    discountPercent: int(NUMBER_LIMITS.discount).nullable(),
    shipping: z
      .object({
        weightGrams: int(NUMBER_LIMITS.weight),
        lengthCm: int(NUMBER_LIMITS.size),
        widthCm: int(NUMBER_LIMITS.size),
        heightCm: int(NUMBER_LIMITS.size),
        fee: int(NUMBER_LIMITS.fee),
      })
      .strict(),
  })
  .strict();

export type ProductCreateRequest = z.infer<typeof productCreateRequestSchema>;

/**
 * The JSON of PUT /api/products/mine/:id: the same as creating, plus the id of each existing variant
 * (a variant without one is new, a missing one is removed) and the existing photos to keep, in order.
 */
export const productUpdateRequestSchema = productCreateRequestSchema
  .extend({
    variants: z.array(variantRequest.extend({ id: numericId.optional() }).strict()).min(1).max(PRODUCT_LIMITS.variants),
    keepImageIds: z.array(numericId).max(PRODUCT_LIMITS.photos),
  })
  .strict();

export type ProductUpdateRequest = z.infer<typeof productUpdateRequestSchema>;

/** The fields a backend message can name, and where the form shows it. */
export const PRODUCT_FIELD_ERRORS = ["name", "description", "categoryId", "discountPercent"] as const;
export const PRODUCT_SECTION_ERRORS = ["images", "tags", "variants", "shipping"] as const;
