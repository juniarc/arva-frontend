import { describe, expect, it } from "vitest";
import { addressSchema } from "./address.schema";

const valid = {
  label: "Home",
  province: { id: "1", name: "DKI Jakarta" },
  city: { id: "11", name: "Jakarta Pusat" },
  district: { id: "111", name: "Tanah Abang" },
  subDistrict: { id: "1111", name: "Kebon Melati" },
  street: "Jl. Jalan No.1",
  recipientName: "Agus",
  phone: "081234567890",
};

function messageFor(input: Record<string, unknown>, field: string) {
  const result = addressSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("addressSchema", () => {
  it("accepts a complete address", () => {
    expect(addressSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts wilayah.id codes as region ids", () => {
    const result = addressSchema.safeParse({
      ...valid,
      province: { id: "31", name: "DKI Jakarta" },
      city: { id: "31.71", name: "Kota Administrasi Jakarta Pusat" },
      district: { id: "31.71.07", name: "Tanah Abang" },
      subDistrict: { id: "31.71.07.1001", name: "Gelora" },
    });
    expect(result.success).toBe(true);
  });

  it("requires a label of at most 30 characters", () => {
    expect(messageFor({ ...valid, label: "" }, "label")).toBe("Address label is required");
    expect(messageFor({ ...valid, label: "a".repeat(31) }, "label")).toBe("Address label must be at most 30 characters");
    expect(addressSchema.safeParse({ ...valid, label: "a".repeat(30) }).success).toBe(true);
  });

  it("requires a street of at most 200 characters", () => {
    expect(messageFor({ ...valid, street: "  " }, "street")).toBe("Address street is required");
    expect(messageFor({ ...valid, street: "a".repeat(201) }, "street")).toBe("Address street must be at most 200 characters");
    expect(addressSchema.safeParse({ ...valid, street: "a".repeat(200) }).success).toBe(true);
  });

  it("requires a recipient name of at most 30 characters", () => {
    expect(messageFor({ ...valid, recipientName: "" }, "recipientName")).toBe("Recipient's name is required");
    expect(messageFor({ ...valid, recipientName: "a".repeat(31) }, "recipientName")).toBe(
      "Recipient's name must be at most 30 characters",
    );
  });

  it("accepts a phone of 8 to 15 digits", () => {
    expect(addressSchema.safeParse({ ...valid, phone: "12345678" }).success).toBe(true);
    expect(addressSchema.safeParse({ ...valid, phone: "123456789012345" }).success).toBe(true);
  });

  it("rejects a phone that is too short or too long", () => {
    expect(messageFor({ ...valid, phone: "1234567" }, "phone")).toBe("Phone number must be at least 8 digits");
    expect(messageFor({ ...valid, phone: "1234567890123456" }, "phone")).toBe("Phone number must be at most 15 digits");
  });

  it("rejects letters and symbols in the phone", () => {
    expect(messageFor({ ...valid, phone: "0812abc5678" }, "phone")).toBe("Phone number can only contain digits");
    expect(messageFor({ ...valid, phone: "+6281234567" }, "phone")).toBe("Phone number can only contain digits");
    expect(messageFor({ ...valid, phone: "" }, "phone")).toBe("Phone number is required");
  });

  it("requires every region, the sub-district included", () => {
    expect(messageFor({ ...valid, subDistrict: undefined }, "subDistrict")).toBe("Select a sub-district");
    expect(messageFor({ ...valid, province: undefined }, "province")).toBe("Select a province");
    expect(messageFor({ ...valid, city: undefined }, "city")).toBe("Select a city");
    expect(messageFor({ ...valid, district: undefined }, "district")).toBe("Select a district");
  });
});
