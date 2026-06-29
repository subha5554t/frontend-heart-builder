import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { profileSchema, type ProfileInput } from "@/lib/validators";
import { PageHeader } from "@/components/layout/PageHeader";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const submit = handleSubmit(async (values) => {
    if (!user) return;
    try {
      const updated = await authApi.updateProfile(user.id, values);
      setUser(updated);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Update failed");
    }
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4 sm:p-6">
      <PageHeader
        title="Settings"
        description="Manage your profile and appearance."
      />

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name ?? "?"} size="lg" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Update your account details.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" error={errors.name?.message}>
            <Input {...register("name")} placeholder="Jane Doe" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input {...register("email")} type="email" placeholder="jane@acme.com" />
          </Field>
          <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Choose how TaskFlow looks to you.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ThemeOption
            active={theme === "light"}
            onClick={() => setTheme("light")}
            icon={<Sun className="h-4 w-4" />}
            label="Light"
          />
          <ThemeOption
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
            icon={<Moon className="h-4 w-4" />}
            label="Dark"
          />
        </div>
      </section>
    </div>
  );
}

function ThemeOption({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-accent text-foreground"
          : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
