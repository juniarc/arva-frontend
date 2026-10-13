import type { Metadata } from "next";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { loadProfile } from "@/features/profile/data/profile.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "My Profile" };

const PROFILE_PATH = "/profile";

/** Server Component: checks the session, loads the real profile, and hands it to the client component. */
export default async function ProfileRoute() {
  const { token } = await requireUser(PROFILE_PATH);

  const result = await loadProfile(token);
  if (result.status === "unauthorized") redirectToLogin(PROFILE_PATH);

  return <ProfilePage initialProfile={result.profile} />;
}
