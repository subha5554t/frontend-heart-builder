import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ListTodo,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { statusLabel, formatDate, fromNow, isOverdue, activityText } from "@/lib/format";
import type { TaskStatus } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const STATUS_FILL: Record<string, string> = {
  TODO: "var(--color-chart-1)",
  IN_PROGRESS: "var(--color-chart-2)",
  IN_REVIEW: "var(--color-chart-3)",
  DONE: "var(--color-chart-4)",
};

function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? ""}`}
        description="Here's what's happening across your projects."
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Active tasks" value={data.stats.activeTasks} icon={ListTodo} />
            <StatCard
              label="Due this week"
              value={data.stats.dueThisWeek}
              icon={CalendarClock}
            />
            <StatCard
              label="Overdue"
              value={data.stats.overdue}
              icon={AlertTriangle}
              tone="danger"
            />
            <StatCard
              label="Done this month"
              value={data.stats.completedThisMonth}
              icon={CheckCircle2}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-foreground">
                Tasks by status
              </h2>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.statusDistribution} barCategoryGap="30%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--color-border)"
                    />
                    <XAxis
                      dataKey="status"
                      tickFormatter={(v) => statusLabel(v as TaskStatus)}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-secondary)" }}
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelFormatter={(v) => statusLabel(v as TaskStatus)}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {data.statusDistribution.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_FILL[entry.status]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Upcoming deadlines
                </h2>
              </div>
              <div className="mt-3 space-y-1">
                {data.upcomingDeadlines.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No upcoming deadlines.
                  </p>
                ) : (
                  data.upcomingDeadlines.map((task) => (
                    <Link
                      key={task.id}
                      to="/projects/$projectId"
                      params={{ projectId: task.projectId }}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-secondary"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {task.title}
                      </span>
                      <span
                        className={
                          isOverdue(task.dueDate)
                            ? "shrink-0 text-xs font-medium text-priority-urgent"
                            : "shrink-0 text-xs text-muted-foreground"
                        }
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
            <div className="mt-3">
              {data.recentActivity.length === 0 ? (
                <EmptyState
                  title="Nothing yet"
                  description="Activity from your projects will show up here."
                  className="border-0 py-8"
                />
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((activity) => (
                    <li key={activity.id} className="flex items-start gap-3">
                      <Avatar name={activity.userId} size="sm" />
                      <div className="min-w-0 flex-1 text-sm">
                        <span className="text-muted-foreground">
                          {activityText(activity.action, activity.meta)}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground/70">
                          · {fromNow(activity.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link
              to="/projects"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all projects <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
