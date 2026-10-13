import { describe, expect, it } from "vitest";
import { shopEditFormSchema, shopEditRequestSchema } from "./shop-edit.schema";

const valid = {
  name: "Bali Fresh Farm",
  provinceId: "31",
  cityId: "31.71",
  districtId: "31.71.07",
  subDistrictId: "31.71.07.1001",
  street: "Jl. Kebon Sirih No. 1",
  shippingChannelIds: ["1"],
  email: "shop@example.com",
  phone: "+6281234567890",
  openingTime: "09:00",
  closingTime: "19:00",
};

function messageFor(input: Record<string, unknown>, field: string) {
  const result = shopEditFormSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("shopEditFormSchema", () => {
  it("accepts a complete shop", () => {
    expect(shopEditFormSchema.safeParse(valid).success).toBe(true);
  });

  it("name: required, 3 to 50 characters, trimmed", () => {
    expect(messageFor({ ...valid, name: "" }, "name")).toBe("Field cannot be empty.");
    expect(messageFor({ ...valid, name: "   " }, "name")).toBe("Field cannot be empty.");
    expect(messageFor({ ...valid, name: "ab" }, "name")).toBe("Shop name must be at least 3 characters.");
    expect(messageFor({ ...valid, name: "a".repeat(51) }, "name")).toBe("Shop name must be at most 50 characters.");
    expect(shopEditFormSchema.safeParse({ ...valid, name: "abc" }).success).toBe(true);
    expect(shopEditFormSchema.safeParse({ ...valid, name: "a".repeat(50) }).success).toBe(true);
  });

  it("street: required, at most 200 characters", () => {
    expect(messageFor({ ...valid, street: "" }, "street")).toBe("Address street is required");
    expect(messageFor({ ...valid, street: "a".repeat(201) }, "street")).toBe("Address street must be at most 200 characters");
  });

  it("every region is required", () => {
    expect(messageFor({ ...valid, provinceId: "" }, "provinceId")).toBe("Select a province");
    expect(messageFor({ ...valid, cityId: "" }, "cityId")).toBe("Select a city");
    expect(messageFor({ ...valid, districtId: "" }, "districtId")).toBe("Select a district");
    expect(messageFor({ ...valid, subDistrictId: "" }, "subDistrictId")).toBe("Select a sub-district");
  });

  it("email: required and a valid format", () => {
    expect(messageFor({ ...valid, email: "" }, "email")).toBe("Field cannot be empty.");
    expect(messageFor({ ...valid, email: "nope" }, "email")).toBe("Invalid email format.");
  });

  it("phone: empty, or an optional + and 8 to 15 digits", () => {
    for (const phone of ["", "081234567", "+6281234567890"]) {
      expect(shopEditFormSchema.safeParse({ ...valid, phone }).success, phone).toBe(true);
    }
    for (const phone of ["1234567", "+", "08abc12345", "0812-3456-789"]) {
      expect(messageFor({ ...valid, phone }, "phone"), phone).toBe("Invalid phone number format.");
    }
  });

  it("hours: HH:MM, and closing must be later than opening", () => {
    expect(messageFor({ ...valid, openingTime: "9am" }, "openingTime")).toBe("Enter a time like 09:00.");
    expect(messageFor({ ...valid, closingTime: "25:00" }, "closingTime")).toBe("Enter a time like 09:00.");
    expect(messageFor({ ...valid, openingTime: "19:00", closingTime: "09:00" }, "closingTime")).toBe(
      "Closing time must be later than opening time.",
    );
    expect(messageFor({ ...valid, openingTime: "09:00", closingTime: "09:00" }, "closingTime")).toBe(
      "Closing time must be later than opening time.",
    );
    expect(shopEditFormSchema.safeParse({ ...valid, openingTime: "00:00", closingTime: "23:59" }).success).toBe(true);
  });

  it("needs at least one shipping channel", () => {
    expect(messageFor({ ...valid, shippingChannelIds: [] }, "shippingChannelIds")).toBe("Choose at least one shipping channel.");
    expect(shopEditFormSchema.safeParse({ ...valid, shippingChannelIds: ["1", "2"] }).success).toBe(true);
  });
});

describe("shopEditRequestSchema", () => {
  it("accepts null to clear the phone, and rejects an empty string and extra fields", () => {
    expect(shopEditRequestSchema.safeParse({ ...valid, phone: null }).success).toBe(true);
    expect(shopEditRequestSchema.safeParse({ ...valid, phone: "" }).success).toBe(false);
    expect(shopEditRequestSchema.safeParse({ ...valid, isOwner: true }).success).toBe(false);
  });

  it("also checks the hours", () => {
    expect(shopEditRequestSchema.safeParse({ ...valid, closingTime: "08:00" }).success).toBe(false);
  });
});
