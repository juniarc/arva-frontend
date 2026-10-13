import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { proxyErrorBody } from "@/lib/api/proxy-error";
import { requestJson } from "@/lib/api/http";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { parseMyShop, ShopMappingError } from "../mappers/shop.mapper";
import { shopEditRequestSchema } from "../schemas/shop-edit.schema";

/**
 * Our own /api/shops routes. The browser never talks to the backend: each proxy checks the body, adds the
 * token from the httpOnly cookie, and checks the answer with the mapper before the browser sees it.
 */

const TIMEOUT_MS = 8_000;

/** Statuses that mean something to the user. Anything else becomes a 502. */
const PASS_THROUGH_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429]);

interface WriteRoute {
  method: "POST" | "PUT";
  path: string;
  schema: z.ZodTypeAny;
  failureMessage: string;
  /** The fields a 409 may name. */
  conflictFields: readonly string[];
  /** The log event prefix. */
  event: string;
}

async function proxyWrite(request: Request, route: WriteRoute): Promise<NextResponse> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: "Please log in again." }, { status: 401 });

  const parsed = route.schema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return NextResponse.json({ message: "Please check your details and try again." }, { status: 400 });

  const result = await requestJson(`${getEnv().API_BASE_URL}${route.path}`, {
    method: route.method,
    body: parsed.data,
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "network") {
      return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }
    if (result.status >= 500 || result.status === 404) {
      logServerError(`${route.event}_failed`, { endpoint: route.path, status: result.status, reason: result.reason });
    }
    const status = PASS_THROUGH_STATUSES.has(result.status) ? result.status : 502;
    return NextResponse.json(proxyErrorBody(result.status, result.body, route.failureMessage, route.conflictFields), { status });
  }

  try {
    return NextResponse.json({ shop: parseMyShop(result.data) }, { status: result.status });
  } catch (error) {
    if (!(error instanceof ShopMappingError)) throw error;
    logServerError(`${route.event}_unexpected_response`, { endpoint: route.path, status: result.status });
    return NextResponse.json({ message: route.failureMessage }, { status: 502 });
  }
}

/** PUT /api/shops/me: saves the owner's shop information. */
export function proxyUpdateMyShop(request: Request): Promise<NextResponse> {
  return proxyWrite(request, {
    method: "PUT",
    path: "/shops/me",
    schema: shopEditRequestSchema,
    failureMessage: "Could not save your shop. Please try again.",
    conflictFields: ["name"],
    event: "shop.update",
  });
}

/** POST /api/shops: opens a shop. The body is the same as an edit's. */
export function proxyCreateShop(request: Request): Promise<NextResponse> {
  return proxyWrite(request, {
    method: "POST",
    path: "/shops",
    schema: shopEditRequestSchema,
    failureMessage: "Could not create your shop. Please try again.",
    conflictFields: ["name"],
    event: "shop.create",
  });
}
