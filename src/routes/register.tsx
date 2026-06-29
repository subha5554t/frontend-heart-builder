import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { ApiError } from "@/lib/api";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "./login";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser(values);
      navigate({ to: "/dashboard" });
    } catch (error) {
      setError("root", {
        message:
          error instanceof ApiError ? error.message : "Unable to create account",
      });
    }
  });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start organizing your work with TaskFlow"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters"
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
        </Field>
        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
        </Field>

        {errors.root && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
