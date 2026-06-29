import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Plus, LayoutGrid, List as ListIcon } from "lucide-react";
import {
  useProject,
  useProjectMembers,
} from "@/hooks/useProjects";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useMoveTask,
  useDeleteTask,
  useBulkUpdate,
} from "@/hooks/useTasks";
import type { TaskFilters } from "@/lib/api/tasks";
import { useDebounce } from "@/hooks/useDebounce";
import type { Task, TaskStatus } from "@/lib/types";
import type { TaskInput } from "@/lib/validators";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskFilterBar } from "@/components/tasks/TaskFilterBar";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";

export const Route = createFileRoute("/_app/projects/$projectId")({
  component: ProjectDetailPage,
});

type ViewMode = "board" | "list";

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: members = [] } = useProjectMembers(projectId);

  const [view, setView] = useState<ViewMode>("board");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filters, setFilters] = useState<TaskFilters>({
    status: "ALL",
    priority: "ALL",
    assigneeId: "ALL",
    sortBy: "createdAt",
  });

  const activeFilters = useMemo<TaskFilters>(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const { data: tasks = [], isLoading: tasksLoading } = useTasks(
    projectId,
    activeFilters,
  );

  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId);
  const moveTask = useMoveTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const bulkUpdate = useBulkUpdate(projectId);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formStatus, setFormStatus] = useState<TaskStatus>("TODO");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const openCreate = (status: TaskStatus) => {
    setEditingTask(null);
    setFormStatus(status);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleSubmit = async (values: TaskInput) => {
    if (editingTask) {
      await updateTask.mutateAsync({ taskId: editingTask.id, changes: values });
    } else {
      await createTask.mutateAsync(values);
    }
  };

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Projects
      </Link>

      {projectLoading ? (
        <Skeleton className="h-10 w-64" />
      ) : (
        <PageHeader
          title={project?.name ?? "Project"}
          description={project?.description}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-border p-0.5">
                <ViewToggle
                  active={view === "board"}
                  onClick={() => setView("board")}
                  icon={<LayoutGrid className="h-4 w-4" />}
                  label="Board"
                />
                <ViewToggle
                  active={view === "list"}
                  onClick={() => setView("list")}
                  icon={<ListIcon className="h-4 w-4" />}
                  label="List"
                />
              </div>
              <Button onClick={() => openCreate("TODO")}>
                <Plus className="h-4 w-4" /> New task
              </Button>
            </div>
          }
        />
      )}

      <TaskFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        search={search}
        onSearchChange={setSearch}
        members={members}
      />

      {tasksLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Create a task or adjust your filters to see results."
          action={
            <Button onClick={() => openCreate("TODO")}>
              <Plus className="h-4 w-4" /> New task
            </Button>
          }
        />
      ) : view === "board" ? (
        <KanbanBoard
          tasks={tasks}
          members={members}
          onMove={(taskId, status) => moveTask.mutate({ taskId, status })}
          onOpenTask={(task) => setOpenTaskId(task.id)}
          onAddTask={openCreate}
        />
      ) : (
        <TaskListView
          tasks={tasks}
          members={members}
          selected={selected}
          onSelectedChange={setSelected}
          onOpenTask={(task) => setOpenTaskId(task.id)}
          onBulkStatus={(status) =>
            bulkUpdate.mutate(
              { ids: selected, action: { type: "status", status } },
              { onSuccess: () => setSelected([]) },
            )
          }
          onBulkDelete={() =>
            bulkUpdate.mutate(
              { ids: selected, action: { type: "delete" } },
              { onSuccess: () => setSelected([]) },
            )
          }
        />
      )}

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        members={members}
        task={editingTask}
        defaultStatus={formStatus}
      />

      <TaskDetailDrawer
        taskId={openTaskId}
        projectId={projectId}
        members={members}
        onClose={() => setOpenTaskId(null)}
        onEdit={() => {
          if (openTask) {
            setOpenTaskId(null);
            openEdit(openTask);
          }
        }}
        onDelete={() => {
          if (openTask) {
            setDeletingTask(openTask);
            setOpenTaskId(null);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={async () => {
          if (deletingTask) await deleteTask.mutateAsync(deletingTask.id);
          setDeletingTask(null);
        }}
        title="Delete task"
        description={`"${deletingTask?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
