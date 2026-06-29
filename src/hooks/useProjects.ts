import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectsApi, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { ProjectInput } from "@/lib/validators";

const keys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
  members: (id: string) => ["projects", id, "members"] as const,
};

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.all,
    queryFn: () => projectsApi.listProjects(user!.id),
    enabled: Boolean(user),
  });
}

export function useProject(projectId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.detail(projectId),
    queryFn: () => projectsApi.getProject(projectId, user!.id),
    enabled: Boolean(user),
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: keys.members(projectId),
    queryFn: () => projectsApi.listMembers(projectId),
  });
}

export function useCreateProject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectsApi.createProject(user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      toast.success("Project created");
    },
    onError: (error) => toast.error(messageFrom(error)),
  });
}

export function useUpdateProject(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) =>
      projectsApi.updateProject(projectId, user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: keys.detail(projectId) });
      toast.success("Project updated");
    },
    onError: (error) => toast.error(messageFrom(error)),
  });
}

export function useArchiveProject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      projectsApi.archiveProject(projectId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      toast.success("Project archived");
    },
    onError: (error) => toast.error(messageFrom(error)),
  });
}

function messageFrom(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong";
}
