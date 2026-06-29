import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import {
  TASK_STATUSES,
  STATUS_LABELS,
  type PublicUser,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { TaskCard } from "@/components/tasks/TaskCard";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  tasks: Task[];
  members: PublicUser[];
  onMove: (taskId: string, status: TaskStatus) => void;
  onOpenTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function KanbanBoard({
  tasks,
  members,
  onMove,
  onOpenTask,
  onAddTask,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  const handleStart = (event: DragStartEvent) =>
    setActiveId(String(event.active.id));

  const handleEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const status = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === active.id);
    if (task && task.status !== status) onMove(task.id, status);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            memberMap={memberMap}
            activeId={activeId}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            assignee={
              activeTask.assigneeId
                ? memberMap.get(activeTask.assigneeId)
                : undefined
            }
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  memberMap: Map<string, PublicUser>;
  activeId: string | null;
  onOpenTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

function Column({
  status,
  tasks,
  memberMap,
  activeId,
  onOpenTask,
  onAddTask,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col rounded-xl border border-border bg-secondary/40">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {STATUS_LABELS[status]}
          </span>
          <span className="rounded-full bg-secondary px-1.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${STATUS_LABELS[status]}`}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 p-2 transition-colors",
          isOver && "bg-accent/40",
        )}
      >
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            assignee={task.assigneeId ? memberMap.get(task.assigneeId) : undefined}
            isActive={activeId === task.id}
            onClick={() => onOpenTask(task)}
          />
        ))}
        {tasks.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            Drop tasks here
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  task,
  assignee,
  isActive,
  onClick,
}: {
  task: Task;
  assignee?: PublicUser;
  isActive: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("touch-none", isActive && "opacity-40")}
      {...listeners}
      {...attributes}
    >
      <TaskCard task={task} assignee={assignee} onClick={onClick} />
    </div>
  );
}
