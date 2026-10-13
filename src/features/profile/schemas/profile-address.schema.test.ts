import { describe, expect, it } from "vitest";
import { profileAddressFormSchema, profileAddressRequestSchema } from "./profile-address.schema";

const valid = {
  street: "Jl. Kebon Sirih No. 1",
  province: { id: "31", name: "DKI Jakarta" },
  city: { id: "31.71", name: "Jakarta Pusat" },
  district: { id: "31.71.07", name: "Tanah Abang" },
  subDistrict: { id: "31.71.07.1001", name: "Gelora" },
  zipCode: "10270",
};

function messageFor(input: Record<string, unknown>, field: string) {
  const result = profileAddressFormSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("profileAddressFormSchema", () => {
  it("accepts a complete address", () => {
    expect(profileAddressFormSchema.safeParse(valid).success).toBe(true);
  });

  it("zip code must be exactly 5 digits", () => {
    for (const zipCode of ["", "1234", "123456", "12a45", "1234 ", "+1234"]) {
      expect(messageFor({ ...valid, zipCode }, "zipCode"), zipCode).toBe("Zip code must be exactly 5 digits.");
    }
  });

  it("street is required and at most 200 characters", () => {
    expect(messageFor({ ...valid, street: "  " }, "street")).toBe("Address street is required");
    expect(messageFor({ ...valid, street: "a".repeat(201) }, "street")).toBe("Address street must be at most 200 characters");
    expect(profileAddressFormSchema.safeParse({ ...valid, street: "a".repeat(200) }).success).toBe(true);
  });

  it("every region is required, the sub-district included", () => {
    expect(messageFor({ ...valid, subDistrict: undefined }, "subDistrict")).toBe("Select a sub-district");
    expect(messageFor({ ...valid, district: undefined }, "district")).toBe("Select a district");
    expect(messageFor({ ...valid, city: undefined }, "city")).toBe("Select a city");
    expect(messageFor({ ...valid, province: undefined }, "province")).toBe("Select a province");
  });
});

describe("profileAddressRequestSchema", () => {
  it("takes the region ids only", () => {
    const request = {
      street: valid.street,
      zipCode: valid.zipCode,
      province: { id: "31" },
      city: { id: "31.71" },
      district: { id: "31.71.07" },
      subDistrict: { id: "31.71.07.1001" },
    };
    expect(profileAddressRequestSchema.safeParse(request).success).toBe(true);
    expect(profileAddressRequestSchema.safeParse({ ...request, label: "Home" }).success).toBe(false);
  });
});
