/**
 * Small typed wrapper around fetch used by every API module.
 * It never throws: callers get a result object and decide how to react.
 */

export type HttpResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; reason: "network"; status?: undefined; body?: undefined }
  | { ok: false; reason: "http"; status: number; body: unknown };

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Cache the response for this many seconds (public data only). Default: never cache. */
  revalidateSeconds?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export async function requestJson<T = unknown>(
  url: string,
  { method = "GET", body, headers, timeoutMs = DEFAULT_TIMEOUT_MS, revalidateSeconds }: RequestOptions = {},
): Promise<HttpResult<T>> {
  let response: Response;
  // A file upload is sent as multipart: fetch sets the Content-Type (with its boundary) itself.
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      ...(revalidateSeconds === undefined
        ? { cache: "no-store" as const }
        : { next: { revalidate: revalidateSeconds } }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    // DNS failure, connection refused, offline, timeout...
    return { ok: false, reason: "network" };
  }

  // A body is optional (e.g. 204), and error pages may not be JSON.
  const parsed: unknown = await response.json().catch(() => undefined);

  if (response.ok) {
    return { ok: true, status: response.status, data: parsed as T };
  }
  return { ok: false, reason: "http", status: response.status, body: parsed };
}
