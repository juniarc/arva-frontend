import { describe, expect, it } from "vitest";
import { productUpdateRequestSchema } from "../schemas/product-form.schema";
import { ownedDto } from "../product.fixture";
import { parseOwnedProduct, ProductMappingError, toUpdateRequest } from "./product-form.mapper";

describe("parseOwnedProduct", () => {
  it("fills the form with the product's values, as text, and keeps the photos", () => {
    const owned = parseOwnedProduct(ownedDto());

    expect(owned.id).toBe("42");
    expect(owned.values).toEqual({
      name: "Banana",
      description: "Sweet.",
      categoryId: "2",
      tags: ["corn"],
      variants: [
        { id: "1", label: "1 kg", price: "10000", stock: "3", unit: "kg" },
        { id: "2", label: "500 g", price: "6000", stock: "5", unit: "g" },
      ],
      discountPercent: "10",
      weightGrams: "300",
      widthCm: "20",
      lengthCm: "30",
      heightCm: "10",
      shippingFee: "1000",
    });
    expect(owned.photos).toEqual([
      { id: "11", url: "http://localhost:4000/uploads/products/a.png" },
      { id: "12", url: "http://localhost:4000/uploads/products/b.png" },
    ]);
  });

  it("leaves the package fields empty for a product listed without them, and no discount empty", () => {
    const owned = parseOwnedProduct(ownedDto({ shipping: null, discountPercent: null }));
    expect([owned.values.weightGrams, owned.values.shippingFee, owned.values.discountPercent]).toEqual(["", "", ""]);
  });

  it("rejects a wrong shape", () => {
    expect(() => parseOwnedProduct({ product: { id: 1 } })).toThrow(ProductMappingError);
    expect(() => parseOwnedProduct(ownedDto({ variants: [] }))).toThrow(ProductMappingError);
  });
});

describe("toUpdateRequest", () => {
  it("keeps each existing variant's id, sends new ones without, and lists the photos to keep", () => {
    const { values } = parseOwnedProduct(ownedDto());
    const request = toUpdateRequest(
      { ...values, variants: [values.variants[0]!, { label: "2 kg", price: "18000", stock: "1", unit: "kg" }] },
      ["12"],
    );

    expect(request.variants).toEqual([
      { id: "1", label: "1 kg", price: 10000, stock: 3, unit: "kg" },
      { label: "2 kg", price: 18000, stock: 1, unit: "kg" },
    ]);
    expect(request.keepImageIds).toEqual(["12"]);
    expect(productUpdateRequestSchema.safeParse(request).success).toBe(true);
  });
});
