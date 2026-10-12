import { describe, expect, it } from "vitest";
import { loginSchema } from "./login.schema";

function firstMessage(input: unknown, field: string) {
  const result = loginSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("loginSchema", () => {
  it("accepts valid input", () => {
    expect(loginSchema.safeParse({ username: "farmer1", password: "password1" }).success).toBe(true);
  });

  it("requires username and password", () => {
    expect(firstMessage({ username: "", password: "" }, "username")).toBe("Username is required");
    expect(firstMessage({ username: "", password: "" }, "password")).toBe("Password is required");
  });

  it("enforces username length 3 to 30", () => {
    expect(firstMessage({ username: "ab", password: "password1" }, "username")).toBe(
      "Username must be at least 3 characters",
    );
    expect(firstMessage({ username: "a".repeat(31), password: "password1" }, "username")).toBe(
      "Username must be at most 30 characters",
    );
    expect(loginSchema.safeParse({ username: "a".repeat(30), password: "password1" }).success).toBe(true);
  });

  it("trims the username before validating", () => {
    expect(firstMessage({ username: "  ab  ", password: "password1" }, "username")).toBe(
      "Username must be at least 3 characters",
    );
  });

  it("requires a password of at least 8 characters", () => {
    expect(firstMessage({ username: "farmer1", password: "short" }, "password")).toBe(
      "Password must be at least 8 characters",
    );
  });
});
