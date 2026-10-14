import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { validatePhoto } from "@/features/profile/schemas/photo.schema";
import { requestJson } from "@/lib/api/http";
import { proxyErrorBody } from "@/lib/api/proxy-error";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { parseCreatedProduct, ProductMappingError } from "../mappers/product-form.mapper";
import { PRODUCT_LIMITS, productCreateRequestSchema, productUpdateRequestSchema } from "../schemas/product-form.schema";

/**
 * Our own /api/products routes for the owner. The browser never talks to the backend: these proxies
 * check the product JSON and every photo, add the token from the httpOnly cookie, and send a fresh
 * form with only those parts on.
 */

const UPLOAD_TIMEOUT_MS = 30_000;
const TIMEOUT_MS = 8_000;
const PASS_THROUGH_STATUSES = new Set([400, 401, 403, 404, 409, 413, 422, 429]);
const PRODUCT_ID = /^\d{1,9}$/;

/** The "data" field is text holding JSON. Anything else is undefined, which the schema then rejects. */
function readJson(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string") return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

const bad = (errors: Record<string, string>) =>
  NextResponse.json({ message: "Please fix the highlighted fields.", errors }, { status: 400 });
const notFound = () => NextResponse.json({ message: "Product not found." }, { status: 404 });

async function readToken(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value;
}

/** Sends a request to the backend and turns its failure into a body the browser may see. */
async function forward(
  path: string,
  init: { method: "POST" | "PUT" | "DELETE"; body?: FormData; token: string; timeoutMs: number },
  event: string,
  failureMessage: string,
) {
  const result = await requestJson(`${getEnv().API_BASE_URL}${path}`, {
    method: init.method,
    body: init.body,
    headers: { Authorization: `Bearer ${init.token}` },
    timeoutMs: init.timeoutMs,
  });
  if (result.ok) return { ok: true as const, status: result.status, data: result.data };
  if (result.reason === "network") {
    return { ok: false as const, response: NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 }) };
  }
  // Every failure is logged with its status (never the body), so the terminal shows why it failed.
  logServerError(`${event}_failed`, { endpoint: "/products", status: result.status, reason: result.reason });
  const status = PASS_THROUGH_STATUSES.has(result.status) ? result.status : 502;
  return { ok: false as const, response: NextResponse.json(proxyErrorBody(result.status, result.body, failureMessage, []), { status }) };
}

interface UploadRoute {
  method: "POST" | "PUT";
  path: string;
  schema: z.ZodTypeAny;
  /** Creating needs a photo; editing can keep the existing ones and add none. */
  minPhotos: number;
  event: string;
  failureMessage: string;
}

async function proxyUpload(request: Request, route: UploadRoute): Promise<NextResponse> {
  const token = await readToken();
  if (!token) return NextResponse.json({ message: "Please log in again." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) return bad({ body: "The upload could not be read." });

  const parsed = route.schema.safeParse(readJson(form.get("data")));
  if (!parsed.success) return bad({ data: "Please check the product details and try again." });

  const photos = form.getAll("images");
  if (photos.length < route.minPhotos) return bad({ images: "Add at least one photo." });
  if (photos.length > PRODUCT_LIMITS.photos) return bad({ images: `Add up to ${PRODUCT_LIMITS.photos} photos.` });
  for (const photo of photos) {
    if (!(photo instanceof File)) return bad({ images: "Add at least one photo." });
    const problem = validatePhoto(photo);
    if (problem) return bad({ images: problem });
  }

  const outgoing = new FormData();
  outgoing.append("data", JSON.stringify(parsed.data));
  for (const photo of photos as File[]) outgoing.append("images", photo, photo.name);

  const result = await forward(route.path, { method: route.method, body: outgoing, token, timeoutMs: UPLOAD_TIMEOUT_MS }, route.event, route.failureMessage);
  if (!result.ok) return result.response;

  try {
    return NextResponse.json({ product: parseCreatedProduct(result.data) }, { status: result.status });
  } catch (error) {
    if (!(error instanceof ProductMappingError)) throw error;
    logServerError(`${route.event}_unexpected_response`, { endpoint: "/products", status: result.status });
    return NextResponse.json({ message: route.failureMessage }, { status: 502 });
  }
}

/** POST /api/products: lists a new product in the user's shop. */
export function proxyCreateProduct(request: Request): Promise<NextResponse> {
  return proxyUpload(request, {
    method: "POST",
    path: "/products",
    schema: productCreateRequestSchema,
    minPhotos: 1,
    event: "product.create",
    failureMessage: "Could not upload your product. Please try again.",
  });
}

/** PUT /api/products/mine/:id: saves an edit of one of the user's products. */
export function proxyUpdateProduct(request: Request, productId: string): Promise<NextResponse> {
  if (!PRODUCT_ID.test(productId)) return Promise.resolve(notFound());
  return proxyUpload(request, {
    method: "PUT",
    path: `/products/mine/${productId}`,
    schema: productUpdateRequestSchema,
    minPhotos: 0,
    event: "product.update",
    failureMessage: "Could not save your product. Please try again.",
  });
}

/** DELETE /api/products/mine/:id: removes one of the user's products completely. */
export async function proxyDeleteProduct(productId: string): Promise<NextResponse> {
  if (!PRODUCT_ID.test(productId)) return notFound();
  const token = await readToken();
  if (!token) return NextResponse.json({ message: "Please log in again." }, { status: 401 });

  const result = await forward(
    `/products/mine/${productId}`,
    { method: "DELETE", token, timeoutMs: TIMEOUT_MS },
    "product.delete",
    "Could not delete the product. Please try again.",
  );
  return result.ok ? new NextResponse(null, { status: 204 }) : result.response;
}
