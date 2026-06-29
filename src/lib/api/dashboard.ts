import { delay, getDb } from "@/lib/mock/store";
import type { Activity, Task, TaskStatus } from "@/lib/types";

export interface DashboardSummary {
  stats: {
    activeTasks: number;
    dueThisWeek: number;
    overdue: number;
    completedThisMonth: number;
  };
  statusDistribution: Array<{ status: TaskStatus; count: number }>;
  completionsLast7Days: Array<{ day: string; count: number }>;
  recentActivity: Activity[];
  upcomingDeadlines: Task[];
}

// One aggregated read, computed from the member's visible tasks — the client
// analogue of the spec's single /dashboard/summary endpoint.
export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const db = getDb();
  const projectIds = db.projects
    .filter((p) => p.status === "ACTIVE" && p.memberIds.includes(userId))
    .map((p) => p.id);
  const tasks = db.tasks.filter((t) => projectIds.includes(t.projectId));

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = {
    activeTasks: tasks.filter((t) => t.status !== "DONE").length,
    dueThisWeek: tasks.filter(
      (t) =>
        t.status !== "DONE" &&
        t.dueDate &&
        new Date(t.dueDate) >= now &&
        new Date(t.dueDate) <= weekAhead,
    ).length,
    overdue: tasks.filter(
      (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now,
    ).length,
    completedThisMonth: tasks.filter(
      (t) => t.status === "DONE" && new Date(t.updatedAt) >= monthStart,
    ).length,
  };

  const statusDistribution = (["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as TaskStatus[]).map(
    (status) => ({ status, count: tasks.filter((t) => t.status === status).length }),
  );

  const completionsLast7Days = buildLast7Days(tasks);

  const recentActivity = db.activities
    .filter((a) => tasks.some((t) => t.id === a.taskId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const upcomingDeadlines = tasks
    .filter((t) => t.status !== "DONE" && t.dueDate)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 5);

  return delay({
    stats,
    statusDistribution,
    completionsLast7Days,
    recentActivity,
    upcomingDeadlines,
  });
}

function buildLast7Days(tasks: Task[]): Array<{ day: string; count: number }> {
  const days: Array<{ day: string; count: number }> = [];
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const next = new Date(date.getTime() + 86_400_000);

    const count = tasks.filter((t) => {
      if (t.status !== "DONE") return false;
      const updated = new Date(t.updatedAt);
      return updated >= date && updated < next;
    }).length;

    days.push({ day: labels[date.getDay()], count });
  }
  return days;
}
