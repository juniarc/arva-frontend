import "server-only";
import { NextResponse } from "next/server";
import type { AuthError, AuthErrorCode } from "../types";
import { validationError } from "./errors";

const STATUS_BY_CODE: Record<AuthErrorCode, number> = {
  validation: 400,
  invalid_credentials: 401,
  conflict: 409,
  server: 502,
  network: 503,
};

/** Reads the request body as JSON. Returns undefined when it is missing or malformed. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function errorResponse(error: AuthError): NextResponse {
  return NextResponse.json({ error }, { status: STATUS_BY_CODE[error.code] });
}

export function invalidRequestResponse(): NextResponse {
  return errorResponse(validationError);
}
