import type { TaskPriority } from "@/lib/types";
import { PRIORITY_STYLES, priorityLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

// Color + text label together so priority is never communicated by color alone.
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const style = PRIORITY_STYLES[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        style.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {priorityLabel(priority)}
    </span>
  );
}
