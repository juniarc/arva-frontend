import { NextResponse } from "next/server";
import { backendLogin } from "@/features/auth/api/backend";
import {
  errorResponse,
  invalidRequestResponse,
  readJsonBody,
} from "@/features/auth/api/route-helpers";
import { loginSchema } from "@/features/auth/schemas/login.schema";
import { setAuthCookie } from "@/lib/cookies";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return invalidRequestResponse();

  const result = await backendLogin(parsed.data);
  if (!result.ok) return errorResponse(result.error);

  // The token goes into an httpOnly cookie and is never sent back in the body.
  const response = NextResponse.json({ user: result.data.user });
  setAuthCookie(response, result.data.access_token);
  return response;
}
