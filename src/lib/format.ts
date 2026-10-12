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

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

/** "2026-10-06T10:00:00Z" -> "1 week ago". Returns an empty string for an invalid date. */
export function formatTimeAgo(isoDate: string, now: number = Date.now()): string {
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return "";

  const elapsed = Math.max(0, now - time);
  if (elapsed < MINUTE_MS) return "just now";
  if (elapsed < HOUR_MS) return plural(Math.floor(elapsed / MINUTE_MS), "minute");
  if (elapsed < DAY_MS) return plural(Math.floor(elapsed / HOUR_MS), "hour");
  if (elapsed < 7 * DAY_MS) return plural(Math.floor(elapsed / DAY_MS), "day");
  if (elapsed < 30 * DAY_MS) return plural(Math.floor(elapsed / (7 * DAY_MS)), "week");
  if (elapsed < 365 * DAY_MS) return plural(Math.floor(elapsed / (30 * DAY_MS)), "month");
  return plural(Math.floor(elapsed / (365 * DAY_MS)), "year");
}
