import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata: Metadata = { title: "Sign Up" };

export default function SignupPage() {
  return <SignupForm />;
}
