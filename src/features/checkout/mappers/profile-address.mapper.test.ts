import { describe, expect, it } from "vitest";
import { makeProfile } from "@/features/profile/profile.fixture";
import { addressFromProfile } from "./profile-address.mapper";

describe("addressFromProfile", () => {
  it("makes a complete checkout address: label Home, the profile name, and the phone without its +", () => {
    const prefill = addressFromProfile(makeProfile());

    expect(prefill?.complete).toBe(true);
    expect(prefill?.address).toEqual({
      label: "Home",
      province: { id: "31", name: "DKI Jakarta" },
      city: { id: "31.71", name: "Kota Administrasi Jakarta Pusat" },
      district: { id: "31.71.07", name: "Tanah Abang" },
      subDistrict: { id: "31.71.07.1001", name: "Gelora" },
      street: "Jl. Kebon Sirih No. 1",
      recipientName: "Agus Setiawan",
      phone: "6281234567890",
    });
  });

  it("is null when the profile has no address", () => {
    expect(addressFromProfile(makeProfile({ address: null }))).toBeNull();
  });

  it("leaves the phone empty, and is not complete, when the profile has none", () => {
    const prefill = addressFromProfile(makeProfile({ user: { ...makeProfile().user, phone: null } }));
    expect(prefill?.address.phone).toBe("");
    expect(prefill?.complete).toBe(false);
  });

  it("leaves the recipient empty when the name is longer than checkout allows (30)", () => {
    const prefill = addressFromProfile(makeProfile({ user: { ...makeProfile().user, name: "A".repeat(31) } }));
    expect(prefill?.address.recipientName).toBe("");
    expect(prefill?.complete).toBe(false);
  });
});
