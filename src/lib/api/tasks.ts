import { commit, delay, getDb, uid } from "@/lib/mock/store";
import type {
  Activity,
  ActivityAction,
  Comment,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import type { TaskInput } from "@/lib/validators";
import { ApiError } from "@/lib/api/shared";

export interface TaskFilters {
  search?: string;
  status?: TaskStatus | "ALL";
  priority?: TaskPriority | "ALL";
  assigneeId?: string | "ALL";
  sortBy?: "dueDate" | "priority" | "createdAt";
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export async function listTasks(
  projectId: string,
  filters: TaskFilters = {},
): Promise<Task[]> {
  let tasks = getDb().tasks.filter((t) => t.projectId === projectId);

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(search) ||
        (t.description ?? "").toLowerCase().includes(search),
    );
  }
  if (filters.status && filters.status !== "ALL") {
    tasks = tasks.filter((t) => t.status === filters.status);
  }
  if (filters.priority && filters.priority !== "ALL") {
    tasks = tasks.filter((t) => t.priority === filters.priority);
  }
  if (filters.assigneeId && filters.assigneeId !== "ALL") {
    tasks = tasks.filter((t) => t.assigneeId === filters.assigneeId);
  }

  tasks = [...tasks].sort((a, b) => {
    switch (filters.sortBy) {
      case "priority":
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      case "createdAt":
        return b.createdAt.localeCompare(a.createdAt);
      case "dueDate":
      default:
        return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    }
  });

  return delay(tasks);
}

export async function getTask(taskId: string): Promise<Task> {
  const task = getDb().tasks.find((t) => t.id === taskId);
  if (!task) throw new ApiError(404, "Task not found");
  return delay(task);
}

export async function createTask(
  userId: string,
  projectId: string,
  input: TaskInput,
): Promise<Task> {
  const id = uid("t");
  const now = new Date().toISOString();
  commit((db) => {
    db.tasks.push({
      id,
      title: input.title,
      description: input.description ?? "",
      status: input.status as TaskStatus,
      priority: input.priority as TaskPriority,
      dueDate: input.dueDate || undefined,
      labels: input.labels ?? [],
      commentCount: 0,
      projectId,
      assigneeId: input.assigneeId || undefined,
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    });
    db.activities.push(buildActivity(id, userId, "task_created"));
  });
  return delay(getDb().tasks.find((t) => t.id === id)!);
}

// Update + activity log live in one commit so they can never drift apart —
// the client analogue of the spec's prisma.$transaction.
export async function updateTask(
  userId: string,
  taskId: string,
  changes: Partial<TaskInput>,
): Promise<Task> {
  commit((db) => {
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) throw new ApiError(404, "Task not found");

    if (changes.status && changes.status !== task.status) {
      db.activities.push(
        buildActivity(taskId, userId, "status_changed", {
          from: task.status,
          to: changes.status,
        }),
      );
      task.status = changes.status as TaskStatus;
    }
    if (changes.priority && changes.priority !== task.priority) {
      db.activities.push(
        buildActivity(taskId, userId, "priority_changed", {
          from: task.priority,
          to: changes.priority,
        }),
      );
      task.priority = changes.priority as TaskPriority;
    }
    if (changes.assigneeId !== undefined && changes.assigneeId !== task.assigneeId) {
      db.activities.push(
        buildActivity(taskId, userId, "assignee_changed", {
          to: changes.assigneeId || null,
        }),
      );
      task.assigneeId = changes.assigneeId || undefined;
    }
    if (changes.title !== undefined) task.title = changes.title;
    if (changes.description !== undefined) task.description = changes.description;
    if (changes.dueDate !== undefined) task.dueDate = changes.dueDate || undefined;
    if (changes.labels !== undefined) task.labels = changes.labels;

    task.updatedAt = new Date().toISOString();
  });
  return delay(getDb().tasks.find((t) => t.id === taskId)!);
}

export async function deleteTask(taskId: string): Promise<{ success: true }> {
  commit((db) => {
    db.tasks = db.tasks.filter((t) => t.id !== taskId);
    db.comments = db.comments.filter((c) => c.taskId !== taskId);
    db.activities = db.activities.filter((a) => a.taskId !== taskId);
  });
  return delay({ success: true } as const);
}

export interface BulkAction {
  ids: string[];
  action: { type: "status"; status: TaskStatus } | { type: "delete" };
}

export async function bulkUpdate(
  userId: string,
  payload: BulkAction,
): Promise<{ success: true }> {
  commit((db) => {
    if (payload.action.type === "delete") {
      db.tasks = db.tasks.filter((t) => !payload.ids.includes(t.id));
      db.comments = db.comments.filter((c) => !payload.ids.includes(c.taskId));
      db.activities = db.activities.filter((a) => !payload.ids.includes(a.taskId));
      return;
    }

    const { status } = payload.action;
    for (const task of db.tasks) {
      if (!payload.ids.includes(task.id) || task.status === status) continue;
      db.activities.push(
        buildActivity(task.id, userId, "status_changed", {
          from: task.status,
          to: status,
        }),
      );
      task.status = status;
      task.updatedAt = new Date().toISOString();
    }
  });
  return delay({ success: true } as const);
}

export async function listComments(taskId: string): Promise<Comment[]> {
  const comments = getDb()
    .comments.filter((c) => c.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return delay(comments);
}

export async function addComment(
  userId: string,
  taskId: string,
  text: string,
): Promise<Comment> {
  const id = uid("c");
  commit((db) => {
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) throw new ApiError(404, "Task not found");
    db.comments.push({ id, text, taskId, userId, createdAt: new Date().toISOString() });
    task.commentCount += 1;
    db.activities.push(buildActivity(taskId, userId, "comment_added"));
  });
  return delay(getDb().comments.find((c) => c.id === id)!);
}

export async function listActivity(taskId: string): Promise<Activity[]> {
  const activities = getDb()
    .activities.filter((a) => a.taskId === taskId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return delay(activities);
}

function buildActivity(
  taskId: string,
  userId: string,
  action: ActivityAction,
  meta?: Record<string, unknown>,
): Activity {
  return {
    id: uid("a"),
    action,
    meta,
    taskId,
    userId,
    createdAt: new Date().toISOString(),
  };
}
