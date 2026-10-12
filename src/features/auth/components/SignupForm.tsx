"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextInput } from "@/components/ui/TextInput";
import { register as registerAccount } from "../api/auth";
import { signupSchema, type SignupInput } from "../schemas/signup.schema";
import { GoogleButton } from "./GoogleButton";

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const result = await registerAccount(values);
    if (!result.ok) {
      const { field, message } = result.error;
      if (field) {
        // e.g. "email already registered" appears under the email input.
        setError(field, { type: "server", message }, { shouldFocus: true });
      } else {
        setFormError(message);
      }
      return;
    }

    router.push("/login?success=account_created");
  });

  return (
    <div className="flex flex-col gap-5">
      {formError && <Alert variant="error" message={formError} />}

      <h1 className="text-center font-serif text-3xl font-bold text-ink">Create Your Account</h1>

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
        <TextInput
          id="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          autoComplete="email"
          icon={<Mail className="size-4" aria-hidden="true" />}
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordInput
          id="password"
          label="Password"
          placeholder="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirm password"
          placeholder="Password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" variant="brand" loading={isSubmitting} className="mt-2">
          Sign Up
        </Button>
      </form>

      <Divider>Or sign up with</Divider>
      <GoogleButton id="google-signup" label="Sign up with Google" />

      <div className="flex flex-col items-center gap-2 text-center text-xs">
        <p>Already have an account ?</p>
        <ButtonLink href="/login" variant="mint">
          Login
        </ButtonLink>
      </div>
    </div>
  );
}
