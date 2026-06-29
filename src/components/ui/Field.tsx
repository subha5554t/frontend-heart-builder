import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

// Wraps a form control with its label, hint and inline error message so every
// input is consistently labelled and accessible.
export const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ label, htmlFor, error, hint, required, className, children }, ref) => (
    <div ref={ref} className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  ),
);

Field.displayName = "Field";
