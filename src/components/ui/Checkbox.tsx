import { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, onChange, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-4 w-4 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-card hover:border-primary/50",
        className,
      )}
      {...props}
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  ),
);

Checkbox.displayName = "Checkbox";
