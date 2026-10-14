import { describe, expect, it } from "vitest";
import { EMPTY_PRODUCT, toCreateRequest } from "../mappers/product-form.mapper";
import { productCreateRequestSchema, productFormSchema, type ProductFormValues } from "./product-form.schema";

const valid: ProductFormValues = {
  ...EMPTY_PRODUCT,
  name: "Banana Fruits from Bali",
  description: "Sweet bananas.",
  categoryId: "2",
  tags: ["Corn", "Fresh"],
  variants: [
    { label: "1 kg", price: "10000", stock: "30", unit: "kg" },
    { label: "500 g", price: "6000", stock: "0", unit: "g" },
  ],
  discountPercent: "10",
  weightGrams: "300",
  widthCm: "20",
  lengthCm: "30",
  heightCm: "10",
  shippingFee: "1000",
};

function messageFor(input: ProductFormValues, path: string) {
  const result = productFormSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path.join(".") === path)?.message;
}

describe("productFormSchema", () => {
  it("accepts a complete product", () => {
    expect(productFormSchema.safeParse(valid).success).toBe(true);
  });

  it("needs a name, a description and a category", () => {
    expect(messageFor({ ...valid, name: " " }, "name")).toBe("Product name is required.");
    expect(messageFor({ ...valid, name: "a".repeat(201) }, "name")).toBe("Product name must be at most 200 characters.");
    expect(messageFor({ ...valid, description: "" }, "description")).toBe("Product description is required.");
    expect(messageFor({ ...valid, description: "a".repeat(3001) }, "description")).toBe(
      "Product description must be at most 3000 characters.",
    );
    expect(messageFor({ ...valid, categoryId: "" }, "categoryId")).toBe("Choose a category.");
  });

  it("checks each variant: label, price from Rp 100, stock from 0, whole numbers", () => {
    const variant = valid.variants[0]!;
    expect(messageFor({ ...valid, variants: [{ ...variant, label: "" }] }, "variants.0.label")).toBe("Variant label is required.");
    expect(messageFor({ ...valid, variants: [{ ...variant, price: "" }] }, "variants.0.price")).toBe("Price is required.");
    expect(messageFor({ ...valid, variants: [{ ...variant, price: "50" }] }, "variants.0.price")).toBe("Price must be at least 100.");
    expect(messageFor({ ...valid, variants: [{ ...variant, price: "1.5" }] }, "variants.0.price")).toBe("Price must be a whole number.");
    expect(messageFor({ ...valid, variants: [{ ...variant, stock: "" }] }, "variants.0.stock")).toBe("Stock is required.");
  });

  it("needs at least one variant, and different labels", () => {
    expect(messageFor({ ...valid, variants: [] }, "variants")).toBe("Add at least one variant.");
    const twins = [valid.variants[0]!, { ...valid.variants[1]!, label: "1 KG" }];
    expect(messageFor({ ...valid, variants: twins }, "variants.1.label")).toBe("Each variant needs a different label.");
  });

  it("takes an empty discount, or 1 to 90", () => {
    expect(productFormSchema.safeParse({ ...valid, discountPercent: "" }).success).toBe(true);
    expect(messageFor({ ...valid, discountPercent: "0" }, "discountPercent")).toBe("Discount must be at least 1.");
    expect(messageFor({ ...valid, discountPercent: "95" }, "discountPercent")).toBe("Discount must be at most 90.");
  });

  it("needs the package size and the shipping fee", () => {
    expect(messageFor({ ...valid, weightGrams: "" }, "weightGrams")).toBe("Package weight is required.");
    expect(messageFor({ ...valid, heightCm: "0" }, "heightCm")).toBe("Package height must be at least 1.");
    expect(productFormSchema.safeParse({ ...valid, shippingFee: "0" }).success).toBe(true);
  });
});

describe("toCreateRequest", () => {
  it("turns the form's text into the request's numbers, and an empty discount into null", () => {
    const request = toCreateRequest({ ...valid, name: "  Banana  ", discountPercent: "" });

    expect(request).toEqual({
      name: "Banana",
      description: "Sweet bananas.",
      categoryId: "2",
      tags: ["Corn", "Fresh"],
      variants: [
        { label: "1 kg", price: 10000, stock: 30, unit: "kg" },
        { label: "500 g", price: 6000, stock: 0, unit: "g" },
      ],
      discountPercent: null,
      shipping: { weightGrams: 300, lengthCm: 30, widthCm: 20, heightCm: 10, fee: 1000 },
    });
    expect(productCreateRequestSchema.safeParse(request).success).toBe(true);
  });

  it("the request schema rejects extra fields and out-of-range numbers", () => {
    const request = toCreateRequest(valid);
    expect(productCreateRequestSchema.safeParse({ ...request, shopId: "9" }).success).toBe(false);
    expect(productCreateRequestSchema.safeParse({ ...request, discountPercent: 95 }).success).toBe(false);
  });
});
