import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksApi, ApiError } from "@/lib/api";
import type { BulkAction, TaskFilters } from "@/lib/api/tasks";
import { useAuth } from "@/context/AuthContext";
import type { Task, TaskStatus } from "@/lib/types";
import type { TaskInput } from "@/lib/validators";

const keys = {
  list: (projectId: string, filters?: TaskFilters) =>
    ["tasks", projectId, filters ?? {}] as const,
  listRoot: (projectId: string) => ["tasks", projectId] as const,
  detail: (taskId: string) => ["task", taskId] as const,
  comments: (taskId: string) => ["task", taskId, "comments"] as const,
  activity: (taskId: string) => ["task", taskId, "activity"] as const,
};

export function useTasks(projectId: string, filters: TaskFilters) {
  return useQuery({
    queryKey: keys.list(projectId, filters),
    queryFn: () => tasksApi.listTasks(projectId, filters),
  });
}

export function useTask(taskId: string | null) {
  return useQuery({
    queryKey: keys.detail(taskId ?? ""),
    queryFn: () => tasksApi.getTask(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useComments(taskId: string | null) {
  return useQuery({
    queryKey: keys.comments(taskId ?? ""),
    queryFn: () => tasksApi.listComments(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useActivity(taskId: string | null) {
  return useQuery({
    queryKey: keys.activity(taskId ?? ""),
    queryFn: () => tasksApi.listActivity(taskId!),
    enabled: Boolean(taskId),
  });
}

function invalidateProject(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) {
  queryClient.invalidateQueries({ queryKey: keys.listRoot(projectId) });
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useCreateTask(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) =>
      tasksApi.createTask(user!.id, projectId, input),
    onSuccess: () => {
      invalidateProject(queryClient, projectId);
      toast.success("Task added");
    },
    onError: (error) => toast.error(messageFrom(error)),
  });
}

export function useUpdateTask(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, changes }: { taskId: string; changes: Partial<TaskInput> }) =>
      tasksApi.updateTask(user!.id, taskId, changes),
    onSuccess: (task) => {
      invalidateProject(queryClient, projectId);
      queryClient.invalidateQueries({ queryKey: keys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: keys.activity(task.id) });
    },
    onError: (error) => toast.error(messageFrom(error)),
  });
}

// Optimistic drag-to-change-status: update every cached list for the project
// immediately, roll everything back if the write fails.
export function useMoveTask(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksApi.updateTask(user!.id, taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: keys.listRoot(projectId) });
      const snapshots = queryClient.getQueriesData<Task[]>({
        queryKey: keys.listRoot(projectId),
      });
      for (const [key, tasks] of snapshots) {
        if (!tasks) continue;
        queryClient.setQueryData<Task[]>(
          key,
          tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
        );
      }
      return { snapshots };
    },
    onError: (error, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(messageFrom(error) || "Couldn't move task — reverted");
    },
    onSettled: () => invalidateProject(queryClient, projectId),
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(taskId),
    onSuccess: () => {
      invalidateProject(queryClient, projectId);
      toast.success("Task deleted");
    },
    onError: (error) => toast.error(messageFrom(error)),
  });
}

export function useBulkUpdate(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkAction) => tasksApi.bulkUpdate(user!.id, payload),
    onSuccess: () => {
      invalidateProject(queryClient, projectId);
      toast.success("Tasks updated");
    },
    onError: (error) => toast.error(messageFrom(error)),
  });
}

export function useAddComment(taskId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => tasksApi.addComment(user!.id, taskId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.comments(taskId) });
      queryClient.invalidateQueries({ queryKey: keys.activity(taskId) });
      queryClient.invalidateQueries({ queryKey: keys.detail(taskId) });
    },
    onError: (error) => toast.error(messageFrom(error)),
  });
}

function messageFrom(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong";
}
