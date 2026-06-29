import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  CheckCircle2,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-card animate-in slide-in-from-left">
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">TaskFlow</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "!bg-secondary !text-foreground" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>,
    document.body,
  );
}
