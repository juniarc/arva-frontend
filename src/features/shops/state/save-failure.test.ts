import { describe, expect, it } from "vitest";
import { readSaveFailure } from "./save-failure";

const known = ["name", "cityId", "street"];
const FALLBACK = "Could not create your shop. Please try again.";
const fail = (status: number, message: string, extra: { field?: string; errors?: Record<string, string> } = {}) => ({
  ok: false as const,
  status,
  message,
  ...extra,
});

describe("readSaveFailure", () => {
  it("puts a 409's message under its field", () => {
    expect(readSaveFailure(fail(409, "This shop name is already taken.", { field: "name" }), known, FALLBACK)).toEqual({
      fieldErrors: { name: "This shop name is already taken." },
      banner: null,
    });
  });

  it("puts a 400's messages under the fields the form has", () => {
    const result = readSaveFailure(fail(400, "Please fix the highlighted fields.", { errors: { cityId: "City not found.", zipCode: "Bad zip." } }), known, FALLBACK);
    expect(result).toEqual({ fieldErrors: { cityId: "City not found." }, banner: null });
  });

  it("shows a 400's message for a field the form does not have in the banner", () => {
    const result = readSaveFailure(fail(400, "Please fix the highlighted fields.", { errors: { zipCode: "Zip code must be exactly 5 digits." } }), known, FALLBACK);
    expect(result.banner).toBe("Zip code must be exactly 5 digits.");
  });

  it("shows the backend's own message for a 4xx the user can act on", () => {
    expect(readSaveFailure(fail(409, "You already have a shop."), known, FALLBACK).banner).toBe("You already have a shop.");
    expect(readSaveFailure(fail(429, "Too many requests. Please try again later."), known, FALLBACK).banner).toBe(
      "Too many requests. Please try again later.",
    );
    expect(readSaveFailure(fail(401, "Please log in again."), known, FALLBACK).banner).toBe("Please log in again.");
  });

  it("shows the network message when the server cannot be reached", () => {
    expect(readSaveFailure(fail(0, "Unable to reach the server. Please try again."), known, FALLBACK).banner).toBe(
      "Unable to reach the server. Please try again.",
    );
  });

  it("uses the fallback for a server error, a 404 and a bad answer", () => {
    for (const status of [500, 502, 503, 404]) {
      expect(readSaveFailure(fail(status, "anything"), known, FALLBACK).banner, String(status)).toBe(FALLBACK);
    }
  });
});
