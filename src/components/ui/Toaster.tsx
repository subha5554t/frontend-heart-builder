import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/hooks/useTheme";

// Thin wrapper that keeps the toast surface in sync with our theme tokens.
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-card !border-border !text-foreground !rounded-lg !shadow-lg",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
        },
      }}
    />
  );
}
