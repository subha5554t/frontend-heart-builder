// Barrel for the mock API layer. Swapping to a real REST backend means
// replacing the bodies of these modules with fetch calls — nothing else in the
// app imports the store directly.
export * as authApi from "@/lib/api/auth";
export * as projectsApi from "@/lib/api/projects";
export * as tasksApi from "@/lib/api/tasks";
export * as dashboardApi from "@/lib/api/dashboard";
export { ApiError } from "@/lib/api/shared";
