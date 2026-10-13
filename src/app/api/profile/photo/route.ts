import { proxyProfile } from "@/features/profile/api/profile.server";

/** Uploads a new profile photo (one image: JPG, PNG or WebP, up to 2 MB). */
export async function PUT(request: Request) {
  return proxyProfile(request, "photo");
}
