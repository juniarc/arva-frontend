import { proxyProfile } from "@/features/profile/api/profile.server";

/** Saves the profile address. It never touches a checkout draft's address. */
export async function PUT(request: Request) {
  return proxyProfile(request, "address");
}
