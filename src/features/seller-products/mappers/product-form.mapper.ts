import { z } from "zod";
import {
  PRODUCT_UNITS,
  type ProductCreateRequest,
  type ProductFormValues,
  type ProductUnit,
  type ProductUpdateRequest,
} from "../schemas/product-form.schema";

/** The backend sent something the form cannot use. */
export class ProductMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductMappingError";
  }
}

export interface CreatedProduct {
  id: string;
  slug: string;
}

const createdSchema = z.object({
  product: z.object({ id: z.union([z.string(), z.number()]).transform(String), slug: z.string().min(1) }),
});

/** POST /products answer: `{ product: { id, slug } }`. */
export function parseCreatedProduct(data: unknown): CreatedProduct {
  const result = createdSchema.safeParse(data);
  if (!result.success) throw new ProductMappingError("Unexpected product response shape.");
  return result.data.product;
}

/** The form's text becomes the request's numbers. Tags and labels are trimmed; an empty discount is null. */
export function toCreateRequest(values: ProductFormValues): ProductCreateRequest {
  const discount = values.discountPercent.trim();
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    categoryId: values.categoryId,
    tags: values.tags.map((tag) => tag.trim()).filter(Boolean),
    variants: values.variants.map((variant) => ({
      label: variant.label.trim(),
      price: Number(variant.price),
      stock: Number(variant.stock),
      unit: variant.unit,
    })),
    discountPercent: discount === "" ? null : Number(discount),
    shipping: {
      weightGrams: Number(values.weightGrams),
      lengthCm: Number(values.lengthCm),
      widthCm: Number(values.widthCm),
      heightCm: Number(values.heightCm),
      fee: Number(values.shippingFee),
    },
  };
}

/** The update body: the create body, with each existing variant's id and the photos to keep. */
export function toUpdateRequest(values: ProductFormValues, keepImageIds: string[]): ProductUpdateRequest {
  const request = toCreateRequest(values);
  return {
    ...request,
    variants: request.variants.map((variant, index) => {
      const id = values.variants[index]?.id;
      return id ? { id, ...variant } : variant;
    }),
    keepImageIds,
  };
}

/** One of the owner's products, as the edit form needs it (GET /products/mine/:id). */
export interface OwnedProduct {
  id: string;
  slug: string;
  values: ProductFormValues;
  photos: { id: string; url: string }[];
}

const id = z.union([z.string(), z.number()]).transform(String);
const ownedSchema = z.object({
  product: z.object({
    id,
    slug: z.string().min(1),
    name: z.string(),
    description: z.string(),
    categoryId: id,
    tags: z.array(z.string()),
    discountPercent: z.number().int().nullable(),
    shipping: z
      .object({ weightGrams: z.number(), lengthCm: z.number(), widthCm: z.number(), heightCm: z.number(), fee: z.number() })
      .nullable(),
    variants: z.array(z.object({ id, label: z.string(), price: z.number(), stock: z.number(), unit: z.string() })).min(1),
    images: z.array(z.object({ id, url: z.string() })),
  }),
});

const UNITS = new Set<string>(PRODUCT_UNITS.map((unit) => unit.value));
const text = (value: number | undefined) => (value === undefined ? "" : String(value));

/** Throws ProductMappingError for a response with the wrong shape. A product listed without a package size gets empty fields. */
export function parseOwnedProduct(data: unknown): OwnedProduct {
  const result = ownedSchema.safeParse(data);
  if (!result.success) throw new ProductMappingError("Unexpected product response shape.");
  const product = result.data.product;
  return {
    id: product.id,
    slug: product.slug,
    photos: product.images,
    values: {
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      tags: product.tags,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        price: String(variant.price),
        stock: String(variant.stock),
        // A unit the form does not know (from older data) falls back to the first one, for the seller to check.
        unit: (UNITS.has(variant.unit) ? variant.unit : "kg") as ProductUnit,
      })),
      discountPercent: product.discountPercent === null ? "" : String(product.discountPercent),
      weightGrams: text(product.shipping?.weightGrams),
      widthCm: text(product.shipping?.widthCm),
      lengthCm: text(product.shipping?.lengthCm),
      heightCm: text(product.shipping?.heightCm),
      shippingFee: text(product.shipping?.fee),
    },
  };
}

/** A new form: one empty variant, no discount. */
export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  description: "",
  categoryId: "",
  tags: [],
  variants: [{ label: "", price: "", stock: "", unit: "kg" }],
  discountPercent: "",
  weightGrams: "",
  widthCm: "",
  lengthCm: "",
  heightCm: "",
  shippingFee: "",
};
