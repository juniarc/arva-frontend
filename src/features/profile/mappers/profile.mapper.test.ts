import { describe, expect, it } from "vitest";
import { makeProfile, profileDto } from "../profile.fixture";
import { parseProfile, ProfileMappingError, toAddressRequest, toInfoRequest } from "./profile.mapper";

describe("parseProfile", () => {
  it("maps the DTO", () => {
    expect(parseProfile(profileDto())).toEqual(makeProfile());
  });

  it("keeps a null address as null, and treats a missing one the same", () => {
    expect(parseProfile(profileDto({ address: null })).address).toBeNull();
    const { user } = profileDto();
    expect(parseProfile({ user }).address).toBeNull();
  });

  it("rejects a response without a user", () => {
    expect(() => parseProfile({ address: null })).toThrow(ProfileMappingError);
    expect(() => parseProfile({ user: null, address: null })).toThrow(ProfileMappingError);
    expect(() => parseProfile(undefined)).toThrow(ProfileMappingError);
  });

  it("rejects an address that is missing a region", () => {
    const dto = profileDto();
    expect(() => parseProfile({ ...dto, address: { ...dto.address, city: undefined } })).toThrow(ProfileMappingError);
  });

  it("turns numeric ids and a numeric zip code into strings", () => {
    const dto = profileDto();
    const profile = parseProfile({
      ...dto,
      address: { ...dto.address, province: { id: 31, name: "DKI Jakarta" }, zipCode: 10270 },
    });
    expect(profile.address?.province.id).toBe("31");
    expect(profile.address?.zipCode).toBe("10270");
  });

  it("turns the backend's numeric region ids into the region lists' dotted codes", () => {
    const dto = profileDto();
    const address = parseProfile({
      ...dto,
      address: {
        ...dto.address,
        province: { id: "12", name: "Sumatera Utara" },
        city: { id: "1211", name: "Kabupaten Dairi" },
        district: { id: "121101", name: "Sidikalang" },
        subDistrict: { id: "1211012001", name: "Batang Beruh" },
      },
    }).address;

    expect([address?.province.id, address?.city.id, address?.district.id, address?.subDistrict.id]).toEqual([
      "12",
      "12.11",
      "12.11.01",
      "12.11.01.2001",
    ]);
  });

  it("keeps a missing or empty phone as null", () => {
    const dto = profileDto();
    expect(parseProfile({ ...dto, user: { ...dto.user, phone: "  " } }).user.phone).toBeNull();
    expect(parseProfile({ ...dto, user: { ...dto.user, phone: undefined } }).user.phone).toBeNull();
  });

  it("only accepts a photo from an http(s) URL or a path on our own site", () => {
    const dto = profileDto();
    const photo = (photoUrl: string) => parseProfile({ ...dto, user: { ...dto.user, photoUrl } }).user.photoUrl;

    expect(photo("https://cdn.test/a.jpg")).toBe("https://cdn.test/a.jpg");
    expect(photo("/uploads/a.jpg")).toBe("/uploads/a.jpg");
    expect(photo("javascript:alert(1)")).toBeNull();
    expect(photo("data:image/svg+xml;base64,AAAA")).toBeNull();
    expect(photo("//evil.test/a.jpg")).toBeNull();
    expect(photo("")).toBeNull();
  });

  it("gives the same profile when its own output is parsed again", () => {
    const once = parseProfile(profileDto());
    expect(parseProfile(once)).toEqual(once);
  });
});

describe("request mappers", () => {
  it("sends null for an empty phone, and trims the text", () => {
    expect(toInfoRequest({ name: " Agus ", username: "agus_01", email: "a@x.co", phone: "" })).toEqual({
      name: "Agus",
      username: "agus_01",
      email: "a@x.co",
      phone: null,
    });
  });

  it("sends only the region ids, as numeric strings without the dots", () => {
    const address = makeProfile().address;
    if (!address) throw new Error("fixture has an address");
    expect(toAddressRequest(address)).toEqual({
      street: "Jl. Kebon Sirih No. 1",
      province: { id: "31" },
      city: { id: "3171" },
      district: { id: "317107" },
      subDistrict: { id: "3171071001" },
      zipCode: "10270",
    });
  });
});
