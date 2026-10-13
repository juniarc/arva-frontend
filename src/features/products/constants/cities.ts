export interface CityOption {
  /** What the backend stores in `city`, and what goes in the URL. It matches exactly (case and all). */
  value: string;
  /** What the user sees. */
  label: string;
}

/**
 * Locations offered by the Location filter. A constant for now: the backend has no list endpoint.
 * The first option is "DKI Jakarta" as in the design; the shops are stored with the city "Jakarta".
 * The others are the cities of the seeded shops.
 */
export const CITY_OPTIONS: readonly CityOption[] = [
  { value: "Jakarta", label: "DKI Jakarta" },
  { value: "Kab. Bandung", label: "Kab. Bandung" },
  { value: "Kab. Bogor", label: "Kab. Bogor" },
  { value: "Kab. Garut", label: "Kab. Garut" },
  { value: "Kab. Badung", label: "Kab. Badung" },
  { value: "Kab. Malang", label: "Kab. Malang" },
];

export function isKnownCity(value: string): boolean {
  return CITY_OPTIONS.some((option) => option.value === value);
}

/** The text to show for a city value from the URL. */
export function cityLabel(value: string): string {
  return CITY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
