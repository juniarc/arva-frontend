import { describe, expect, it } from "vitest";
import { identityFormSchema } from "./create-shop.schema";

const identity = { ownerName: "Agus Setiawan", icNumber: "3171234567890001", acceptedTerms: true };
function messageFor(input: Record<string, unknown>, field: string) {
  const result = identityFormSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("identityFormSchema", () => {
  it("accepts a complete identity", () => {
    expect(identityFormSchema.safeParse(identity).success).toBe(true);
  });

  it("name: required, at most 50 characters", () => {
    expect(messageFor({ ...identity, ownerName: "" }, "ownerName")).toBe("Field cannot be empty.");
    expect(messageFor({ ...identity, ownerName: "a".repeat(51) }, "ownerName")).toBe("Name must be at most 50 characters.");
  });

  it("IC number: required, exactly 16 digits", () => {
    expect(messageFor({ ...identity, icNumber: "" }, "icNumber")).toBe("Field cannot be empty.");
    for (const icNumber of ["123", "317123456789000", "31712345678900012", "3171234567890O01", "3171 2345 6789 0001"]) {
      expect(messageFor({ ...identity, icNumber }, "icNumber"), icNumber).toBe("IC number must be exactly 16 digits.");
    }
  });

  it("the agreement must be checked", () => {
    expect(messageFor({ ...identity, acceptedTerms: false }, "acceptedTerms")).toBe("You must agree to the Terms & Conditions.");
  });
});
