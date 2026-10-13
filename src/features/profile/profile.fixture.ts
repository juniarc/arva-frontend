import type { Profile } from "./types";

/** What the backend sends. */
export const profileDto = (overrides: Record<string, unknown> = {}) => ({
  user: { username: "agus_01", name: "Agus Setiawan", email: "agus@example.com", phone: "+6281234567890", photoUrl: null },
  address: {
    street: "Jl. Kebon Sirih No. 1",
    subDistrict: { id: "31.71.07.1001", name: "Gelora" },
    district: { id: "31.71.07", name: "Tanah Abang" },
    city: { id: "31.71", name: "Kota Administrasi Jakarta Pusat" },
    province: { id: "31", name: "DKI Jakarta" },
    zipCode: "10270",
  },
  ...overrides,
});

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  const dto = profileDto();
  return { user: dto.user, address: dto.address, ...overrides };
}
