import { commit, delay, getDb, uid } from "@/lib/mock/store";
import type { Project, PublicUser } from "@/lib/types";
import type { ProjectInput } from "@/lib/validators";
import { ApiError, toPublicUser } from "@/lib/api/shared";

export interface ProjectWithMeta extends Project {
  taskCount: number;
  doneCount: number;
}

function withMeta(project: Project): ProjectWithMeta {
  const tasks = getDb().tasks.filter((t) => t.projectId === project.id);
  return {
    ...project,
    taskCount: tasks.length,
    doneCount: tasks.filter((t) => t.status === "DONE").length,
  };
}

export async function listProjects(userId: string): Promise<ProjectWithMeta[]> {
  const projects = getDb()
    .projects.filter(
      (p) => p.status === "ACTIVE" && p.memberIds.includes(userId),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(withMeta);

  return delay(projects);
}

export async function getProject(
  projectId: string,
  userId: string,
): Promise<ProjectWithMeta> {
  const project = getDb().projects.find((p) => p.id === projectId);
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.memberIds.includes(userId)) {
    throw new ApiError(403, "You are not a member of this project");
  }
  return delay(withMeta(project));
}

export async function listMembers(projectId: string): Promise<PublicUser[]> {
  const db = getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) throw new ApiError(404, "Project not found");
  const members = db.users
    .filter((u) => project.memberIds.includes(u.id))
    .map(toPublicUser);
  return delay(members);
}

export async function createProject(
  userId: string,
  input: ProjectInput,
): Promise<Project> {
  const id = uid("p");
  const now = new Date().toISOString();
  commit((db) => {
    db.projects.push({
      id,
      name: input.name,
      description: input.description,
      status: "ACTIVE",
      dueDate: input.dueDate || undefined,
      ownerId: userId,
      memberIds: [userId],
      createdAt: now,
      updatedAt: now,
    });
  });
  return delay(getDb().projects.find((p) => p.id === id)!);
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: ProjectInput,
): Promise<Project> {
  commit((db) => {
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) throw new ApiError(404, "Project not found");
    if (project.ownerId !== userId) {
      throw new ApiError(403, "Only the owner can edit this project");
    }
    project.name = input.name;
    project.description = input.description;
    project.dueDate = input.dueDate || undefined;
    project.updatedAt = new Date().toISOString();
  });
  return delay(getDb().projects.find((p) => p.id === projectId)!);
}

// Soft delete: archive instead of dropping rows so task history survives.
export async function archiveProject(
  projectId: string,
  userId: string,
): Promise<{ success: true }> {
  commit((db) => {
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) throw new ApiError(404, "Project not found");
    if (project.ownerId !== userId) {
      throw new ApiError(403, "Only the owner can archive this project");
    }
    project.status = "ARCHIVED";
    project.updatedAt = new Date().toISOString();
  });
  return delay({ success: true } as const);
}
