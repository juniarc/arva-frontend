import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";

/**
 * The address form's province, city, district and sub-district lists come from wilayah.id, a free,
 * static API of Indonesian administrative regions. The browser calls our /api/regions/... routes and
 * this module fetches from wilayah.id, so the third-party host is never called from the browser.
 *
 * wilayah.id answers `{ data: [{ code, name }] }`, with codes like "31", "31.71", "31.71.07" and
 * "31.71.07.1001". We turn that into `{ items: [{ id, name }] }`: the region id is its wilayah.id code.
 */

const TIMEOUT_MS = 8_000;
/** The lists almost never change, so a day is a safe time to keep them. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

const upstreamSchema = z.object({ data: z.array(z.object({ code: z.string().min(1), name: z.string() })) });

interface RegionRoute {
  /** The URL path under /api/regions, e.g. provinces/31/cities. */
  pattern: RegExp;
  /** The wilayah.id file for a match, without the base URL. */
  upstream: (code: string | undefined) => string;
  /** Used in log lines. */
  label: string;
}

// The code in the URL is checked with a strict pattern, so nothing else can reach wilayah.id through us.
const ROUTES: RegionRoute[] = [
  { pattern: /^provinces$/, upstream: () => "/api/provinces.json", label: "provinces" },
  { pattern: /^provinces\/(\d{2})\/cities$/, upstream: (code) => `/api/regencies/${code}.json`, label: "cities" },
  { pattern: /^cities\/(\d{2}\.\d{2})\/districts$/, upstream: (code) => `/api/districts/${code}.json`, label: "districts" },
  {
    pattern: /^districts\/(\d{2}\.\d{2}\.\d{2})\/sub-districts$/,
    upstream: (code) => `/api/villages/${code}.json`,
    label: "sub-districts",
  },
];

/** wilayah.id has stray spaces in some names, for example "Kota Administrasi Jakarta Utara ". */
function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

/** `path` is what follows /api/regions/, for example ["provinces", "31", "cities"]. */
export async function proxyRegions(path: string[]): Promise<NextResponse> {
  const joined = path.join("/");
  const match = ROUTES.map((route) => ({ route, found: route.pattern.exec(joined) })).find((entry) => entry.found);
  if (!match?.found) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const { route } = match;
  const result = await requestJson(`${getEnv().REGIONS_API_BASE_URL}${route.upstream(match.found[1])}`, {
    timeoutMs: TIMEOUT_MS,
    revalidateSeconds: REVALIDATE_SECONDS,
  });

  if (!result.ok) {
    if (result.reason === "network") {
      return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }
    logServerError("regions.request_failed", { endpoint: route.label, status: result.status, reason: result.reason });
    // A missing file means the code does not exist. Anything else is a problem on their side.
    const status = result.status === 404 ? 404 : 502;
    return NextResponse.json({ message: "Could not load the address options." }, { status });
  }

  const parsed = upstreamSchema.safeParse(result.data);
  if (!parsed.success) {
    logServerError("regions.unexpected_response", { endpoint: route.label, status: result.status });
    return NextResponse.json({ message: "Could not load the address options." }, { status: 502 });
  }

  return NextResponse.json({ items: parsed.data.data.map((item) => ({ id: item.code, name: cleanName(item.name) })) });
}
