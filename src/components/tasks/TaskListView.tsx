import { Trash2 } from "lucide-react";
import {
  STATUS_LABELS,
  TASK_STATUSES,
  type PublicUser,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { Checkbox } from "@/components/ui/Checkbox";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { formatDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TaskListViewProps {
  tasks: Task[];
  members: PublicUser[];
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  onOpenTask: (task: Task) => void;
  onBulkStatus: (status: TaskStatus) => void;
  onBulkDelete: () => void;
}

export function TaskListView({
  tasks,
  members,
  selected,
  onSelectedChange,
  onOpenTask,
  onBulkStatus,
  onBulkDelete,
}: TaskListViewProps) {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const allSelected = tasks.length > 0 && selected.length === tasks.length;

  const toggleAll = () =>
    onSelectedChange(allSelected ? [] : tasks.map((t) => t.id));

  const toggleOne = (id: string) =>
    onSelectedChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {selected.length > 0 && (
        <div className="flex items-center gap-3 border-b border-border bg-secondary/50 px-4 py-2.5">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <Select
              className="h-8 w-40"
              value=""
              onChange={(e) => e.target.value && onBulkStatus(e.target.value as TaskStatus)}
              options={[
                { value: "", label: "Set status…" },
                ...TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
              ]}
            />
            <Button variant="danger" size="sm" onClick={onBulkDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="w-10 px-4 py-2.5">
              <Checkbox
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all"
              />
            </th>
            <th className="px-2 py-2.5 font-medium">Task</th>
            <th className="hidden px-2 py-2.5 font-medium sm:table-cell">Status</th>
            <th className="hidden px-2 py-2.5 font-medium sm:table-cell">Priority</th>
            <th className="hidden px-2 py-2.5 font-medium md:table-cell">Assignee</th>
            <th className="hidden px-2 py-2.5 font-medium md:table-cell">Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const assignee = task.assigneeId
              ? memberMap.get(task.assigneeId)
              : undefined;
            const isSelected = selected.includes(task.id);
            return (
              <tr
                key={task.id}
                className={cn(
                  "border-b border-border last:border-0 transition-colors hover:bg-secondary/40",
                  isSelected && "bg-accent/30",
                )}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleOne(task.id)}
                    aria-label={`Select ${task.title}`}
                  />
                </td>
                <td className="px-2 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenTask(task)}
                    className="text-left font-medium text-foreground hover:text-primary"
                  >
                    {task.title}
                  </button>
                </td>
                <td className="hidden px-2 py-3 sm:table-cell">
                  <StatusBadge status={task.status} />
                </td>
                <td className="hidden px-2 py-3 sm:table-cell">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="hidden px-2 py-3 md:table-cell">
                  {assignee ? (
                    <span className="flex items-center gap-2">
                      <Avatar name={assignee.name} size="sm" />
                      <span className="text-muted-foreground">{assignee.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="hidden px-2 py-3 md:table-cell">
                  <span
                    className={cn(
                      "text-muted-foreground",
                      isOverdue(task.dueDate) && "font-medium text-priority-urgent",
                    )}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
