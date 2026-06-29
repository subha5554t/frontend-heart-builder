import type { TaskStatus } from "@/lib/types";
import { statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const STATUS_DOT: Record<TaskStatus, string> = {
  TODO: "bg-muted-foreground",
  IN_PROGRESS: "bg-priority-medium",
  IN_REVIEW: "bg-priority-high",
  DONE: "bg-primary",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {statusLabel(status)}
    </span>
  );
}
