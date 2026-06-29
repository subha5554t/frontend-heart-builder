import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, FolderKanban } from "lucide-react";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useArchiveProject,
} from "@/hooks/useProjects";
import type { ProjectWithMeta } from "@/lib/api/projects";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export const Route = createFileRoute("/_app/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const archiveProject = useArchiveProject();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectWithMeta | null>(null);
  const [archiving, setArchiving] = useState<ProjectWithMeta | null>(null);
  const updateProject = useUpdateProject(editing?.id ?? "");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Projects"
        description="Organize your work into focused workspaces."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={(p) => {
                setEditing(p);
                setFormOpen(true);
              }}
              onArchive={setArchiving}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start adding and tracking tasks."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> New project
            </Button>
          }
        />
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        project={editing}
        onSubmit={(values) =>
          editing
            ? updateProject.mutateAsync(values)
            : createProject.mutateAsync(values)
        }
      />

      <ConfirmDialog
        open={Boolean(archiving)}
        onClose={() => setArchiving(null)}
        title="Archive project?"
        description={`"${archiving?.name}" will be hidden from your active projects. This won't delete its tasks.`}
        confirmLabel="Archive"
        destructive
        onConfirm={async () => {
          if (archiving) await archiveProject.mutateAsync(archiving.id);
          setArchiving(null);
        }}
      />
    </div>
  );
}
