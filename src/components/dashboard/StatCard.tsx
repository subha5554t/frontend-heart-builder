import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger";
}

const TONES = {
  default: "text-muted-foreground",
  warning: "text-priority-high",
  danger: "text-priority-urgent",
};

export function StatCard({ label, value, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", TONES[tone])} />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
