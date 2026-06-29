import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, Send } from "lucide-react";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_PRIORITIES,
  type PublicUser,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/types";
import {
  useTask,
  useComments,
  useActivity,
  useAddComment,
  useUpdateTask,
} from "@/hooks/useTasks";
import { commentSchema, type CommentInput } from "@/lib/validators";
import { Drawer } from "@/components/ui/Drawer";
import { Select } from "@/components/ui/Select";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { formatDate, fromNow, activityText } from "@/lib/format";

interface TaskDetailDrawerProps {
  taskId: string | null;
  projectId: string;
  members: PublicUser[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskDetailDrawer({
  taskId,
  projectId,
  members,
  onClose,
  onEdit,
  onDelete,
}: TaskDetailDrawerProps) {
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask(projectId);
  const [tab, setTab] = useState("comments");

  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <Drawer open={Boolean(taskId)} onClose={onClose} title="Task details" width="max-w-lg">
      {isLoading || !task ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-5 w-5 text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">{task.title}</h2>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit task">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="Delete task"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {task.description && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {task.description}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-3">
            <Detail label="Status">
              <Select
                className="h-8"
                value={task.status}
                onChange={(e) =>
                  updateTask.mutate({
                    taskId: task.id,
                    changes: { status: e.target.value as TaskStatus },
                  })
                }
                options={TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
              />
            </Detail>
            <Detail label="Priority">
              <Select
                className="h-8"
                value={task.priority}
                onChange={(e) =>
                  updateTask.mutate({
                    taskId: task.id,
                    changes: { priority: e.target.value as TaskPriority },
                  })
                }
                options={TASK_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
              />
            </Detail>
            <Detail label="Assignee">
              <Select
                className="h-8"
                value={task.assigneeId ?? ""}
                onChange={(e) =>
                  updateTask.mutate({
                    taskId: task.id,
                    changes: { assigneeId: e.target.value || undefined },
                  })
                }
                options={[
                  { value: "", label: "Unassigned" },
                  ...members.map((m) => ({ value: m.id, label: m.name })),
                ]}
              />
            </Detail>
            <Detail label="Due date">
              <span className="text-sm text-foreground">{formatDate(task.dueDate)}</span>
            </Detail>
          </dl>

          <div>
            <Tabs
              items={[
                { value: "comments", label: "Comments", count: task.commentCount },
                { value: "activity", label: "Activity" },
              ]}
              value={tab}
              onChange={setTab}
            />
            <div className="pt-4">
              {tab === "comments" ? (
                <Comments taskId={task.id} memberMap={memberMap} />
              ) : (
                <ActivityList taskId={task.id} memberMap={memberMap} />
              )}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Comments({
  taskId,
  memberMap,
}: {
  taskId: string;
  memberMap: Map<string, PublicUser>;
}) {
  const { data: comments, isLoading } = useComments(taskId);
  const addComment = useAddComment(taskId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentInput>({ resolver: zodResolver(commentSchema) });

  const submit = handleSubmit(async ({ text }) => {
    await addComment.mutateAsync(text);
    reset();
  });

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-1.5">
        <div className="flex gap-2">
          <input
            {...register("text")}
            placeholder="Write a comment…"
            className="h-9 flex-1 rounded-md border border-input bg-card px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" isLoading={addComment.isPending} aria-label="Add comment">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {errors.text && (
          <p className="text-xs text-destructive">{errors.text.message}</p>
        )}
      </form>

      {isLoading ? (
        <Spinner className="mx-auto h-4 w-4 text-muted-foreground" />
      ) : comments && comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const author = memberMap.get(comment.userId);
            return (
              <li key={comment.id} className="flex gap-2.5">
                <Avatar name={author?.name ?? "?"} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {author?.name ?? "Someone"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fromNow(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No comments yet.
        </p>
      )}
    </div>
  );
}

function ActivityList({
  taskId,
  memberMap,
}: {
  taskId: string;
  memberMap: Map<string, PublicUser>;
}) {
  const { data: activities, isLoading } = useActivity(taskId);

  if (isLoading) {
    return <Spinner className="mx-auto h-4 w-4 text-muted-foreground" />;
  }
  if (!activities || activities.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {activities.map((activity) => {
        const actor = memberMap.get(activity.userId);
        return (
          <li key={activity.id} className="flex gap-2.5 text-sm">
            <Avatar name={actor?.name ?? "?"} size="sm" />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">
                {actor?.name ?? "Someone"}
              </span>{" "}
              <span className="text-muted-foreground">
                {activityText(activity.action, activity.meta)}
              </span>
              <span className="ml-1 text-xs text-muted-foreground/70">
                · {fromNow(activity.createdAt)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
