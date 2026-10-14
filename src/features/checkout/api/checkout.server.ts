import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { messageFromBody } from "@/lib/api/error-message";
import { requestJson } from "@/lib/api/http";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { checkoutAddressRequestSchema } from "../schemas/address.schema";
import {
  createDraftRequestSchema,
  damageProtectionRequestSchema,
  draftSchema,
  orderResponseSchema,
  paymentMethodRequestSchema,
  paymentMethodsSchema,
  shippingOptionsSchema,
  shippingRequestSchema,
  vouchersSchema,
  voucherRequestSchema,
} from "../schemas/checkout.schema";

/**
 * The browser never talks to the backend. It calls our own /api/checkout/... routes, and this proxy adds
 * the token from the httpOnly cookie. (The region lists are not here: see regions.server.ts.)
 * Only the routes in the table below are forwarded. Each one has a body schema (checked here, before
 * the backend sees it) and a response schema (checked here, before the browser sees it).
 */

const TIMEOUT_MS = 8_000;

interface ProxyRoute {
  method: "GET" | "POST" | "PUT";
  pattern: RegExp;
  /** Used in log lines instead of the real path, so ids never end up in the logs. */
  label: string;
  request?: z.ZodTypeAny;
  response: z.ZodTypeAny;
  failureMessage: string;
}

const route = (
  method: ProxyRoute["method"],
  path: string,
  response: z.ZodTypeAny,
  failureMessage: string,
  request?: z.ZodTypeAny,
): ProxyRoute => ({ method, pattern: new RegExp(`^${path}$`), label: path, request, response, failureMessage });

const ROUTES: ProxyRoute[] = [
  route("GET", "/checkout", draftSchema, "Could not load your checkout."),
  route("POST", "/checkout", draftSchema, "Could not start checkout. Please try again.", createDraftRequestSchema),
  route("PUT", "/checkout/address", draftSchema, "Could not save the address. Please try again.", checkoutAddressRequestSchema),
  route("PUT", "/checkout/damage-protection", draftSchema, "Could not update damage protection. Please try again.", damageProtectionRequestSchema),
  route("GET", "/checkout/shipping-options", shippingOptionsSchema, "Could not load shipping options."),
  route("PUT", "/checkout/shipping", draftSchema, "Could not select the shipping option. Please try again.", shippingRequestSchema),
  route("GET", "/checkout/vouchers", vouchersSchema, "Could not load vouchers."),
  route("PUT", "/checkout/voucher", draftSchema, "Could not update the voucher. Please try again.", voucherRequestSchema),
  route("GET", "/checkout/payment-methods", paymentMethodsSchema, "Could not load payment methods."),
  route("PUT", "/checkout/payment-method", draftSchema, "Could not select the payment method. Please try again.", paymentMethodRequestSchema),
  route("POST", "/checkout/orders", orderResponseSchema, "Could not place your order. Please try again."),
];

/** Statuses that mean something to the user. Anything else becomes a 502. */
const PASS_THROUGH_STATUSES = new Set([400, 401, 404, 409, 422, 429, 503]);

/**
 * What the browser gets for a failed call. A 4xx message is written for the user, and so is a 503 that
 * carries a `code` (CHECKOUT_UNAVAILABLE). Any other 5xx message may hold internal details, so it is replaced.
 */
function errorBody(status: number, body: unknown, fallback: string): { message: string; code?: string } {
  const rawCode = typeof body === "object" && body !== null && "code" in body ? (body as { code: unknown }).code : undefined;
  const code = typeof rawCode === "string" && /^[A-Z_]{1,40}$/.test(rawCode) ? rawCode : undefined;

  const trusted = status < 500 || (status === 503 && code !== undefined);
  const message = trusted ? messageFromBody(body, fallback) : fallback;
  return code ? { message, code } : { message };
}

export async function proxyToBackend(request: Request, backendPath: string): Promise<NextResponse> {
  const match = ROUTES.find((candidate) => candidate.method === request.method && candidate.pattern.test(backendPath));
  if (!match) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: "Please log in again." }, { status: 401 });

  let body: unknown;
  if (match.request) {
    const parsed = match.request.safeParse(await request.json().catch(() => undefined));
    if (!parsed.success) return NextResponse.json({ message: "Please check your details and try again." }, { status: 400 });
    body = parsed.data;
  }

  const result = await requestJson(`${getEnv().API_BASE_URL}${backendPath}`, {
    method: match.method,
    body,
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "network") {
      return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }
    // 404 is logged too: until the backend builds an endpoint, that is what it answers.
    if (result.status >= 500 || result.status === 404) {
      logServerError("checkout.request_failed", { endpoint: match.label, status: result.status, reason: result.reason });
    }
    const status = PASS_THROUGH_STATUSES.has(result.status) ? result.status : 502;
    return NextResponse.json(errorBody(result.status, result.body, match.failureMessage), { status });
  }

  const parsed = match.response.safeParse(result.data);
  if (!parsed.success) {
    logServerError("checkout.unexpected_response", { endpoint: match.label, status: result.status });
    return NextResponse.json({ message: match.failureMessage }, { status: 502 });
  }
  return NextResponse.json(parsed.data, { status: result.status });
}
