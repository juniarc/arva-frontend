import { messageFromBody } from "@/lib/api/error-message";
import { requestJson } from "@/lib/api/http";
import { parseCreatedProduct, type CreatedProduct } from "../mappers/product-form.mapper";
import type { ProductCreateRequest, ProductUpdateRequest } from "../schemas/product-form.schema";

/**
 * Browser-side product listing, editing and deleting. Components call these and never use fetch
 * directly. They talk to our own Route Handlers, which add the token from the httpOnly cookie.
 */

type Failure = { ok: false; status: number; message: string; field?: string; errors?: Record<string, string> };
export type ProductApiResult = { ok: true; data: CreatedProduct } | Failure;
export type DeleteResult = { ok: true } | Failure;

/** Up to 5 photos of 2 MB go up in one request, so it gets more time than a normal call. */
const UPLOAD_TIMEOUT_MS = 30_000;
const TIMEOUT_MS = 8_000;
const NETWORK_MESSAGE = "Unable to reach the server. Please try again.";

function readErrors(body: unknown): Record<string, string> | undefined {
  if (typeof body !== "object" || body === null || !("errors" in body)) return undefined;
  const { errors } = body;
  if (typeof errors !== "object" || errors === null) return undefined;
  const entries = Object.entries(errors).filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function failure(status: number, body: unknown, fallback: string): Failure {
  // Only a 4xx message is meant for the user. A 5xx message may contain internal details, so it is never shown.
  const message = status >= 500 ? fallback : messageFromBody(body, fallback);
  return { ok: false, status, message, errors: readErrors(body) };
}

async function sendProduct(method: "POST" | "PUT", url: string, data: unknown, photos: File[], fallback: string): Promise<ProductApiResult> {
  const form = new FormData();
  form.append("data", JSON.stringify(data));
  for (const photo of photos) form.append("images", photo, photo.name);

  const result = await requestJson(url, { method, body: form, timeoutMs: UPLOAD_TIMEOUT_MS });
  if (!result.ok) {
    return result.reason === "network" ? { ok: false, status: 0, message: NETWORK_MESSAGE } : failure(result.status, result.body, fallback);
  }
  try {
    return { ok: true, data: parseCreatedProduct(result.data) };
  } catch {
    return { ok: false, status: 502, message: fallback };
  }
}

/** POST /api/products: the product as JSON in "data", and the photos in "images", in this order. */
export function createProduct(request: ProductCreateRequest, photos: File[]): Promise<ProductApiResult> {
  return sendProduct("POST", "/api/products", request, photos, "Could not upload your product. Please try again.");
}

/** PUT /api/products/mine/:id: the same body, plus the photos to keep. New photos go in "images". */
export function updateProduct(productId: string, request: ProductUpdateRequest, newPhotos: File[]): Promise<ProductApiResult> {
  return sendProduct(
    "PUT",
    `/api/products/mine/${encodeURIComponent(productId)}`,
    request,
    newPhotos,
    "Could not save your product. Please try again.",
  );
}

/** DELETE /api/products/mine/:id. Removes the product completely. */
export async function deleteProduct(productId: string): Promise<DeleteResult> {
  const fallback = "Could not delete the product. Please try again.";
  const result = await requestJson(`/api/products/mine/${encodeURIComponent(productId)}`, { method: "DELETE", timeoutMs: TIMEOUT_MS });
  if (result.ok) return { ok: true };
  return result.reason === "network" ? { ok: false, status: 0, message: NETWORK_MESSAGE } : failure(result.status, result.body, fallback);
}
