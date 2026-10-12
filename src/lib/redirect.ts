/**
 * Returns a safe in-app path to redirect to after login.
 *
 * Only same-site paths are allowed: the value must start with "/" and must
 * not start with "//" (protocol-relative URL) or "/\" (browsers treat the
 * backslash like a slash). Anything else falls back to `fallback`, which
 * prevents open-redirect attacks such as `?redirect=//evil.com`.
 */
export function getSafeRedirect(
  value: string | string[] | undefined | null,
  fallback = "/",
): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
