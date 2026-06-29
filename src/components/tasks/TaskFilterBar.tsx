import { Search } from "lucide-react";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type PublicUser,
} from "@/lib/types";
import type { TaskFilters as Filters } from "@/lib/api/tasks";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface TaskFilterBarProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  search: string;
  onSearchChange: (value: string) => void;
  members: PublicUser[];
}

export function TaskFilterBar({
  filters,
  onChange,
  search,
  onSearchChange,
  members,
}: TaskFilterBarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks…"
          className="pl-9"
        />
      </div>

      <Select
        className="sm:w-36"
        value={filters.status ?? "ALL"}
        onChange={(e) => onChange({ status: e.target.value as Filters["status"] })}
        options={[
          { value: "ALL", label: "All statuses" },
          ...TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
        ]}
      />

      <Select
        className="sm:w-36"
        value={filters.priority ?? "ALL"}
        onChange={(e) => onChange({ priority: e.target.value as Filters["priority"] })}
        options={[
          { value: "ALL", label: "All priorities" },
          ...TASK_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] })),
        ]}
      />

      <Select
        className="sm:w-40"
        value={filters.assigneeId ?? "ALL"}
        onChange={(e) => onChange({ assigneeId: e.target.value })}
        options={[
          { value: "ALL", label: "Anyone" },
          ...members.map((m) => ({ value: m.id, label: m.name })),
        ]}
      />

      <Select
        className="sm:w-40"
        value={filters.sortBy ?? "createdAt"}
        onChange={(e) => onChange({ sortBy: e.target.value as Filters["sortBy"] })}
        options={[
          { value: "createdAt", label: "Newest" },
          { value: "dueDate", label: "Due date" },
          { value: "priority", label: "Priority" },
        ]}
      />
    </div>
  );
}
