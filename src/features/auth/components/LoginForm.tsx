"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextInput } from "@/components/ui/TextInput";
import { getSafeRedirect } from "@/lib/redirect";
import { login } from "../api/auth";
import { loginSchema, type LoginInput } from "../schemas/login.schema";
import { GoogleButton } from "./GoogleButton";

interface LoginFormProps {
  /** Message shown in the green banner, e.g. after sign-up. */
  successMessage?: string;
  /** Raw `redirect` query value. It is validated here before use. */
  redirectTo?: string;
}

export function LoginForm({ successMessage, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const result = await login(values);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }

    router.replace(getSafeRedirect(redirectTo));
    router.refresh(); // re-render server components now that the cookie exists
  });

  return (
    <div className="flex flex-col gap-5">
      {formError ? (
        <Alert variant="error" message={formError} />
      ) : (
        successMessage && <Alert variant="success" message={successMessage} />
      )}

      <h1 className="text-center font-serif text-3xl font-bold text-ink">Login to Your Account</h1>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextInput
          id="username"
          label="Username"
          placeholder="Enter your username"
          autoComplete="username"
          icon={<User className="size-4" aria-hidden="true" />}
          error={errors.username?.message}
          {...register("username")}
        />
        <PasswordInput
          id="password"
          label="Password"
          placeholder="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Link
          href="/forgot-password"
          className="-mt-2 flex min-h-11 items-center justify-end text-xs text-ink hover:underline focus-visible:outline-2 focus-visible:outline-info"
        >
          Forgot Password ?
        </Link>

        <Button type="submit" loading={isSubmitting}>
          Login
        </Button>
      </form>

      <Divider>Or login with</Divider>
      <GoogleButton id="google-login" label="Login with Google" />

      <div className="flex flex-col items-center gap-2 text-center text-xs">
        <p>Don&apos;t have an account ?</p>
        <ButtonLink href="/signup" variant="mint">
          Sign Up
        </ButtonLink>
      </div>
    </div>
  );
}
