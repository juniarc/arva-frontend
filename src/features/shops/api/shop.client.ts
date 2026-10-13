import { messageFromBody } from "@/lib/api/error-message";
import { requestJson } from "@/lib/api/http";
import { parseMyShop } from "../mappers/shop.mapper";
import type { ShopEditRequest } from "../schemas/shop-edit.schema";
import type { MyShop } from "../types";

/**
 * Browser-side shop API. Components call these functions and never use fetch directly.
 * They talk to our own Route Handler, which adds the token from the httpOnly cookie.
 * The shop pages read their data on the server (data/shop.loader.ts), so the only call the browser makes is the save.
 */

export type ShopApiResult =
  | { ok: true; data: MyShop }
  | { ok: false; status: number; message: string; field?: string; errors?: Record<string, string> };

const TIMEOUT_MS = 8_000;
const FAILURE_MESSAGE = "Could not save your shop. Please try again.";

function readErrors(body: unknown): Record<string, string> | undefined {
  if (typeof body !== "object" || body === null || !("errors" in body)) return undefined;
  const { errors } = body;
  if (typeof errors !== "object" || errors === null) return undefined;
  const entries = Object.entries(errors).filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function readField(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("field" in body)) return undefined;
  return typeof body.field === "string" ? body.field : undefined;
}

async function send(method: "POST" | "PUT", url: string, body: unknown): Promise<ShopApiResult> {
  const result = await requestJson(url, { method, body, timeoutMs: TIMEOUT_MS });

  if (!result.ok) {
    if (result.reason === "network") return { ok: false, status: 0, message: "Unable to reach the server. Please try again." };
    // Only a 4xx message is meant for the user. A 5xx message may contain internal details, so it is never shown.
    const message = result.status >= 500 ? FAILURE_MESSAGE : messageFromBody(result.body, FAILURE_MESSAGE);
    return { ok: false, status: result.status, message, field: readField(result.body), errors: readErrors(result.body) };
  }

  try {
    return { ok: true, data: parseMyShop(result.data) };
  } catch {
    return { ok: false, status: 502, message: FAILURE_MESSAGE };
  }
}

/** PUT /api/shops/me. Resolves with the saved shop, or a failure that carries the status and any field messages. */
export function updateMyShop(request: ShopEditRequest): Promise<ShopApiResult> {
  return send("PUT", "/api/shops/me", request);
}

/** POST /api/shops. Opens the user's shop with the same fields as an edit. */
export function createShop(request: ShopEditRequest): Promise<ShopApiResult> {
  return send("POST", "/api/shops", request);
}
