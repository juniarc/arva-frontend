import { describe, expect, it } from "vitest";
import { signupSchema } from "./signup.schema";

const valid = {
  username: "farmer1",
  email: "farmer@example.com",
  password: "password1",
  confirmPassword: "password1",
};

function firstMessage(input: Record<string, string>, field: string) {
  const result = signupSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("signupSchema", () => {
  it("accepts valid input", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("requires every field", () => {
    const empty = { username: "", email: "", password: "", confirmPassword: "" };
    expect(firstMessage(empty, "username")).toBe("Username is required");
    expect(firstMessage(empty, "email")).toBe("Email is required");
    expect(firstMessage(empty, "password")).toBe("Password is required");
    expect(firstMessage(empty, "confirmPassword")).toBe("Please confirm your password");
  });

  it("enforces username length 3 to 30", () => {
    expect(firstMessage({ ...valid, username: "ab" }, "username")).toBe(
      "Username must be at least 3 characters",
    );
    expect(firstMessage({ ...valid, username: "a".repeat(31) }, "username")).toBe(
      "Username must be at most 30 characters",
    );
  });

  it("rejects an invalid email", () => {
    expect(firstMessage({ ...valid, email: "not-an-email" }, "email")).toBe(
      "Enter a valid email address",
    );
  });

  it("rejects a short password", () => {
    expect(firstMessage({ ...valid, password: "abc123", confirmPassword: "abc123" }, "password")).toBe(
      "Password must be at least 8 characters",
    );
  });

  it("requires a number in the password", () => {
    const input = { ...valid, password: "onlyletters", confirmPassword: "onlyletters" };
    expect(firstMessage(input, "password")).toBe("Password must contain at least one number");
  });

  it("requires a letter in the password", () => {
    const input = { ...valid, password: "12345678", confirmPassword: "12345678" };
    expect(firstMessage(input, "password")).toBe("Password must contain at least one letter");
  });

  it("requires confirm password to match", () => {
    expect(firstMessage({ ...valid, confirmPassword: "different1" }, "confirmPassword")).toBe(
      "Passwords do not match",
    );
  });
});
