import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/cookies";

/** Logs out by clearing the httpOnly cookie. No backend call: the contract has no logout endpoint. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}
