import { proxyProfile } from "@/features/profile/api/profile.server";

/** Saves the Profile Info section (name, username, email, phone). */
export async function PUT(request: Request) {
  return proxyProfile(request, "info");
}
