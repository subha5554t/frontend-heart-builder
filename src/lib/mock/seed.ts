import type {
  Activity,
  Comment,
  Project,
  Task,
  User,
} from "@/lib/types";

export interface Database {
  users: User[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  activities: Activity[];
}

// Build a fresh dataset relative to "now" so deadlines and charts always look
// alive whenever a new visitor loads the app.
export function createSeedData(): Database {
  const now = Date.now();
  const day = 86_400_000;
  const iso = (offsetDays: number) => new Date(now + offsetDays * day).toISOString();

  const users: User[] = [
    { id: "u1", name: "Demo User", email: "demo@taskflow.app", password: "password" },
    { id: "u2", name: "Maya Chen", email: "maya@taskflow.app", password: "password" },
    { id: "u3", name: "Leo Park", email: "leo@taskflow.app", password: "password" },
  ];

  const projects: Project[] = [
    {
      id: "p1",
      name: "Website Redesign",
      description: "Marketing site refresh with a new design system and CMS.",
      status: "ACTIVE",
      dueDate: iso(21),
      ownerId: "u1",
      memberIds: ["u1", "u2", "u3"],
      createdAt: iso(-30),
      updatedAt: iso(-2),
    },
    {
      id: "p2",
      name: "Mobile App v2",
      description: "Rebuild the iOS and Android clients on a shared core.",
      status: "ACTIVE",
      dueDate: iso(45),
      ownerId: "u1",
      memberIds: ["u1", "u2"],
      createdAt: iso(-18),
      updatedAt: iso(-1),
    },
    {
      id: "p3",
      name: "Q3 Growth Experiments",
      description: "A/B tests across onboarding and pricing.",
      status: "ACTIVE",
      dueDate: iso(10),
      ownerId: "u1",
      memberIds: ["u1", "u3"],
      createdAt: iso(-9),
      updatedAt: iso(-3),
    },
  ];

  const baseTasks: Array<Partial<Task> & Pick<Task, "title" | "status" | "priority" | "projectId">> = [
    { title: "Audit current information architecture", status: "DONE", priority: "MEDIUM", projectId: "p1", assigneeId: "u2", dueDate: iso(-4), labels: ["research"] },
    { title: "Design new component library", status: "IN_PROGRESS", priority: "HIGH", projectId: "p1", assigneeId: "u2", dueDate: iso(3), labels: ["design", "system"] },
    { title: "Migrate blog to headless CMS", status: "TODO", priority: "MEDIUM", projectId: "p1", assigneeId: "u3", dueDate: iso(12) },
    { title: "Set up analytics + consent banner", status: "IN_REVIEW", priority: "LOW", projectId: "p1", assigneeId: "u1", dueDate: iso(6), labels: ["legal"] },
    { title: "Fix hero layout on mobile", status: "TODO", priority: "URGENT", projectId: "p1", assigneeId: "u1", dueDate: iso(-1), labels: ["bug"] },
    { title: "Define shared networking layer", status: "IN_PROGRESS", priority: "HIGH", projectId: "p2", assigneeId: "u2", dueDate: iso(8) },
    { title: "Implement biometric login", status: "TODO", priority: "MEDIUM", projectId: "p2", assigneeId: "u1", dueDate: iso(20), labels: ["auth"] },
    { title: "Crash on cold start (Android 12)", status: "TODO", priority: "URGENT", projectId: "p2", assigneeId: "u2", dueDate: iso(2), labels: ["bug"] },
    { title: "Release notes for beta build", status: "DONE", priority: "LOW", projectId: "p2", assigneeId: "u1", dueDate: iso(-3) },
    { title: "Draft onboarding variant B", status: "IN_PROGRESS", priority: "MEDIUM", projectId: "p3", assigneeId: "u3", dueDate: iso(4), labels: ["experiment"] },
    { title: "Pricing page copy test", status: "IN_REVIEW", priority: "HIGH", projectId: "p3", assigneeId: "u1", dueDate: iso(1) },
    { title: "Ship referral nudge", status: "DONE", priority: "MEDIUM", projectId: "p3", assigneeId: "u3", dueDate: iso(-5) },
  ];

  const tasks: Task[] = baseTasks.map((t, i) => ({
    id: `t${i + 1}`,
    title: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    labels: t.labels ?? [],
    commentCount: 0,
    projectId: t.projectId,
    assigneeId: t.assigneeId,
    createdById: "u1",
    createdAt: iso(-7 + (i % 5)),
    updatedAt: iso(-(i % 4)),
  }));

  const comments: Comment[] = [
    { id: "c1", text: "Started on the spacing scale — using a 4px base.", taskId: "t2", userId: "u2", createdAt: iso(-1) },
    { id: "c2", text: "Can we prioritise the Android crash today?", taskId: "t8", userId: "u1", createdAt: iso(0) },
  ];

  // Keep the denormalised counter in sync with the seeded comments.
  for (const comment of comments) {
    const task = tasks.find((t) => t.id === comment.taskId);
    if (task) task.commentCount += 1;
  }

  const activities: Activity[] = tasks.map((task, i) => ({
    id: `a${i + 1}`,
    action: "task_created",
    taskId: task.id,
    userId: "u1",
    createdAt: task.createdAt,
  }));

  return { users, projects, tasks, comments, activities };
}
