import { NextResponse } from "next/server";
import { backendRegister } from "@/features/auth/api/backend";
import {
  errorResponse,
  invalidRequestResponse,
  readJsonBody,
} from "@/features/auth/api/route-helpers";
import { signupSchema } from "@/features/auth/schemas/signup.schema";

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return invalidRequestResponse();

  // confirmPassword is only for the form; the backend does not need it.
  const { username, email, password } = parsed.data;
  const result = await backendRegister({ username, email, password });
  if (!result.ok) return errorResponse(result.error);

  // The register endpoint returns no token, so no cookie is set here.
  // The user logs in next, and that is when the "token" cookie is created.
  return NextResponse.json({ user: result.data }, { status: 201 });
}
