import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getSuccessMessage } from "@/features/auth/success-messages";

export const metadata: Metadata = { title: "Login" };

interface LoginPageProps {
  searchParams: Promise<{ success?: string; redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { success, redirect } = await searchParams;

  return <LoginForm successMessage={getSuccessMessage(success)} redirectTo={redirect} />;
}
