import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { ApiError } from "@/lib/api";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "ava@taskflow.dev", password: "password123" },
  });

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      navigate({ to: "/dashboard" });
    } catch (error) {
      setError("root", {
        message: error instanceof ApiError ? error.message : "Unable to sign in",
      });
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your TaskFlow workspace"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
        </Field>

        {errors.root && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Sign in
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Demo account is pre-filled — just press sign in.
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}

export const PendingDot = Loader2;
