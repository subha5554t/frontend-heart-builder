import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Archive, CalendarDays } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ProjectWithMeta } from "@/lib/api/projects";
import { formatDate } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";

interface ProjectCardProps {
  project: ProjectWithMeta;
  onEdit: (project: ProjectWithMeta) => void;
  onArchive: (project: ProjectWithMeta) => void;
}

export function ProjectCard({ project, onEdit, onArchive }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const progress =
    project.taskCount > 0
      ? Math.round((project.completedCount / project.taskCount) * 100)
      : 0;

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/projects/$projectId"
          params={{ projectId: project.id }}
          className="min-w-0 flex-1"
        >
          <h3 className="truncate font-semibold text-foreground">{project.name}</h3>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Project options"
            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(project);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-secondary"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onArchive(project);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            </div>
          )}
        </div>
      </div>

      <Link
        to="/projects/$projectId"
        params={{ projectId: project.id }}
        className="mt-1 flex flex-1 flex-col"
      >
        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
          {project.description || "No description"}
        </p>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {project.completedCount}/{project.taskCount} tasks
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.memberIds.slice(0, 4).map((id) => (
              <Avatar
                key={id}
                name={id}
                size="sm"
                className="ring-2 ring-card"
              />
            ))}
          </div>
          {project.dueDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(project.dueDate)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
