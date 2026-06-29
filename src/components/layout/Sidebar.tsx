import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">TaskFlow</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/dashboard" }}
            className="group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{
              className: cn("!bg-secondary !text-foreground"),
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        Frontend demo · mock data
      </div>
    </aside>
  );
}
