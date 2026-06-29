import { formatDistanceToNow, isPast, isToday } from "date-fns";
import type {
  ActivityAction,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/types";

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fromNow(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function isOverdue(iso?: string): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  return isPast(date) && !isToday(date);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Tailwind tokens for priority. Color is paired with a label everywhere so it
// is never the only signal (accessibility).
export const PRIORITY_STYLES: Record<
  TaskPriority,
  { dot: string; strip: string; badge: string }
> = {
  LOW: { dot: "bg-priority-low", strip: "bg-priority-low", badge: "bg-priority-low/15 text-priority-low" },
  MEDIUM: { dot: "bg-priority-medium", strip: "bg-priority-medium", badge: "bg-priority-medium/15 text-priority-medium" },
  HIGH: { dot: "bg-priority-high", strip: "bg-priority-high", badge: "bg-priority-high/15 text-priority-high" },
  URGENT: { dot: "bg-priority-urgent", strip: "bg-priority-urgent", badge: "bg-priority-urgent/15 text-priority-urgent" },
};

export function priorityLabel(priority: TaskPriority): string {
  return PRIORITY_LABELS[priority];
}

export function statusLabel(status: TaskStatus): string {
  return STATUS_LABELS[status];
}

export function activityText(action: ActivityAction, meta?: Record<string, unknown>): string {
  switch (action) {
    case "task_created":
      return "created this task";
    case "comment_added":
      return "added a comment";
    case "status_changed":
      return `changed status from ${labelOf(meta?.from)} to ${labelOf(meta?.to)}`;
    case "priority_changed":
      return `changed priority from ${labelOf(meta?.from)} to ${labelOf(meta?.to)}`;
    case "assignee_changed":
      return meta?.to ? "reassigned this task" : "unassigned this task";
    default:
      return "updated this task";
  }
}

function labelOf(value: unknown): string {
  if (typeof value !== "string") return "—";
  return (
    STATUS_LABELS[value as TaskStatus] ??
    PRIORITY_LABELS[value as TaskPriority] ??
    value
  );
}
