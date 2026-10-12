/** 1000 -> "Rp 1.000" (Indonesian thousands separator). */
export function formatCurrency(amount: number): string {
  const digits = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${digits}`;
}

/** 501 -> "501 sold", 1200 -> "1.2k sold". */
export function formatSold(count: number): string {
  if (count < 1000) return `${count} sold`;
  return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k sold`;
}

/** "Bali Fresh Farm" -> "bali-fresh-farm". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
