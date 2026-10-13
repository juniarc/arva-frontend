import { describe, expect, it } from "vitest";
import { profileInfoFormSchema, profileInfoRequestSchema } from "./profile.schema";

const valid = { name: "Agus", username: "agus_01", email: "agus@example.com", phone: "+6281234567890" };

function messageFor(input: Record<string, unknown>, field: string) {
  const result = profileInfoFormSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("profileInfoFormSchema", () => {
  it("accepts a complete profile", () => {
    expect(profileInfoFormSchema.safeParse(valid).success).toBe(true);
  });

  it("name: required, at most 50 characters, trimmed", () => {
    expect(messageFor({ ...valid, name: "" }, "name")).toBe("Field cannot be empty.");
    expect(messageFor({ ...valid, name: "   " }, "name")).toBe("Field cannot be empty.");
    expect(messageFor({ ...valid, name: "a".repeat(51) }, "name")).toBe("Name must be at most 50 characters.");
    expect(profileInfoFormSchema.safeParse({ ...valid, name: "a".repeat(50) }).success).toBe(true);
  });

  it("username: required, 3 to 30 characters, letters, numbers and underscores", () => {
    expect(messageFor({ ...valid, username: "" }, "username")).toBe("Field cannot be empty.");
    expect(messageFor({ ...valid, username: "ab" }, "username")).toBe("Username must be at least 3 characters.");
    expect(messageFor({ ...valid, username: "a".repeat(31) }, "username")).toBe("Username must be at most 30 characters.");
    expect(messageFor({ ...valid, username: "agus 01" }, "username")).toBe("Username can only contain letters, numbers and underscores.");
    expect(messageFor({ ...valid, username: "agus-01" }, "username")).toBe("Username can only contain letters, numbers and underscores.");
    expect(profileInfoFormSchema.safeParse({ ...valid, username: "Agus_01" }).success).toBe(true);
  });

  it("email: required and a valid format", () => {
    expect(messageFor({ ...valid, email: "" }, "email")).toBe("Field cannot be empty.");
    expect(messageFor({ ...valid, email: "not-an-email" }, "email")).toBe("Invalid email format.");
    expect(messageFor({ ...valid, email: `${"a".repeat(250)}@x.co` }, "email")).toBe("Email must be at most 254 characters.");
  });

  it("phone: empty, or an optional + and 8 to 15 digits", () => {
    for (const phone of ["", "081234567", "+6281234567890", "12345678", "123456789012345", "+12345678"]) {
      expect(profileInfoFormSchema.safeParse({ ...valid, phone }).success, phone).toBe(true);
    }
    for (const phone of ["1234567", "1234567890123456", "+", "++6281234567", "0812-3456-789", "08abc12345", "62+81234567"]) {
      expect(messageFor({ ...valid, phone }, "phone"), phone).toBe("Invalid phone number format.");
    }
  });
});

describe("profileInfoRequestSchema", () => {
  it("accepts null to clear the phone", () => {
    expect(profileInfoRequestSchema.safeParse({ ...valid, phone: null }).success).toBe(true);
  });

  it("does not accept an empty phone string or extra fields", () => {
    expect(profileInfoRequestSchema.safeParse({ ...valid, phone: "" }).success).toBe(false);
    expect(profileInfoRequestSchema.safeParse({ ...valid, role: "admin" }).success).toBe(false);
  });
});
