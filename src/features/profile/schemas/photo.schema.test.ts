import { describe, expect, it } from "vitest";
import { PHOTO_MAX_BYTES, validatePhoto } from "./photo.schema";

describe("validatePhoto", () => {
  it("accepts jpg, png and webp up to 2 MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validatePhoto({ type, size: 1000 })).toBeNull();
    }
    expect(validatePhoto({ type: "image/png", size: PHOTO_MAX_BYTES })).toBeNull();
  });

  it("rejects other formats", () => {
    expect(validatePhoto({ type: "image/gif", size: 1000 })).toBe("Choose a JPG, PNG or WebP image.");
    expect(validatePhoto({ type: "application/pdf", size: 1000 })).toBe("Choose a JPG, PNG or WebP image.");
    expect(validatePhoto({ type: "", size: 1000 })).toBe("Choose a JPG, PNG or WebP image.");
  });

  it("rejects a file over 2 MB, and an empty one", () => {
    expect(validatePhoto({ type: "image/png", size: PHOTO_MAX_BYTES + 1 })).toBe("The photo must be 2 MB or smaller.");
    expect(validatePhoto({ type: "image/png", size: 0 })).toBe("The photo must be 2 MB or smaller.");
  });
});
