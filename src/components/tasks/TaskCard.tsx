import { MessageSquare, CalendarDays } from "lucide-react";
import type { PublicUser, Task } from "@/lib/types";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  assignee?: PublicUser;
  onClick?: () => void;
  dragging?: boolean;
}

export function TaskCard({ task, assignee, onClick, dragging }: TaskCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-foreground/20",
        dragging && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground">
          {task.title}
        </p>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {assignee && <Avatar name={assignee.name} size="sm" />}
      </div>

      {(task.dueDate || task.commentCount > 0) && (
        <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                isOverdue(task.dueDate) && "text-priority-urgent",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.commentCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {task.commentCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
