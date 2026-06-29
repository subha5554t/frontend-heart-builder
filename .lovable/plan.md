# TaskFlow — Frontend-Only Build Plan

A production-grade **frontend only** implementation of the TaskFlow spec. No backend, no Lovable Cloud. All data flows through a clean, swappable mock API layer persisted to `localStorage`, so the logic layer (hooks, validation, state) is real and defensible — and could later be repointed at the spec's REST API by editing one folder.

## Scope (full spec, frontend)
Auth (Login/Register, mock JWT) · Dashboard (stats + charts) · Projects list (CRUD) · Project Detail Kanban (drag-and-drop, optimistic) · List view (sort/filter/bulk) · Task Detail drawer (edit, comments, activity log) · Settings (profile, password, theme).

## Architecture

The project runs on **TanStack Start (React 19)** — the existing stack — rather than the spec's Vite+React Router, but every frontend principle from Section 12/22 is honored: feature folders, reusable UI, TanStack Query for server state, Context for auth, React Hook Form + Zod for forms, absolute `@/` imports.

```text
src/
├── lib/
│   ├── mock/            # localStorage-backed data store + seed data
│   ├── api/             # per-resource async functions (auth, projects, tasks, dashboard)
│   │                    #   -> the ONLY swap point to go real later
│   ├── types.ts         # User, Project, Task, Comment, Activity, enums
│   └── validators.ts    # shared Zod schemas (mirrors spec validation rules)
├── hooks/               # useAuth, useProjects, useTasks, useDashboard, useDebounce
├── context/             # AuthContext (mock JWT in localStorage)
├── components/
│   ├── ui/              # Button, Input, Modal/Drawer, Badge, Avatar, Skeleton, Select (shadcn-based)
│   ├── layout/          # AppLayout, Sidebar, Topbar (collapsible, bottom nav on mobile)
│   ├── dashboard/       # StatCard, StatusDonut, CompletionsBar, ActivityFeed, DeadlinesList
│   ├── projects/        # ProjectCard, ProjectFormModal
│   ├── tasks/           # TaskCard, TaskDrawer, TaskForm, TaskTableRow, FilterBar
│   └── kanban/          # KanbanBoard, KanbanColumn
└── routes/              # TanStack file routes (see below)
```

### State management
- **TanStack Query** for all "server" data (projects, tasks, dashboard) — caching, loading/error states, and **optimistic updates with rollback** for the Kanban drag (the headline architecture point).
- **AuthContext** for the mock session only.
- `useState` for local UI state (modal open, drawer open) — never duplicating cached data.

### Mock API + persistence
- `lib/mock/store.ts` seeds Users/Projects/Tasks/Comments/Activity into `localStorage` on first load.
- `lib/api/*.ts` exposes async functions (`getProjects`, `createTask`, `updateTask`, `getDashboardSummary`, etc.) that read/write the store with a tiny artificial delay so loading skeletons and optimistic UI are demonstrable.
- Mutations auto-write **activity log** entries on status/priority/assignee change and keep `commentCount` in sync — mirroring the spec's transaction behavior in the client.
- Mock auth: register/login validate against the store, issue a fake token string to `localStorage`; protected routes redirect to `/login`.

## Routes
```text
/login                      Login + Register tab toggle (public)
/_authenticated/            layout: Sidebar + Topbar, redirects out if no token
  index (/)                 Dashboard
  projects                  Projects list
  projects/$projectId       Project Detail — Kanban (default) + List view toggle, Task drawer
  settings                  Settings
```
Each route gets its own `head()` metadata; root keeps `<Outlet/>` intact.

## Pages
1. **Login/Register** — tabbed card, centered, RHF+Zod inline validation on blur, spinner + toast on error.
2. **Dashboard** — 4 stat cards (Active, Due This Week, Overdue [red], Completed This Month), Recharts donut (status distribution) + bar (completions last 7 days), Recent Activity feed, Upcoming Deadlines, Quick Actions. Skeletons + empty state.
3. **Projects List** — responsive card grid, search, create/edit modal (name 3–100 required, optional desc/due date), skeleton + empty CTA.
4. **Project Detail / Kanban** — 4 fixed columns (To Do, In Progress, In Review, Done) via **@dnd-kit**, optimistic move + rollback toast, quick-add task, filter bar, view toggle. Cards: priority color strip, due-date badge (red if overdue), assignee avatar, label chips, comment count. Horizontal scroll on mobile.
5. **List View** — sortable/filterable table, checkbox bulk-select (bulk status change/delete), debounced search (300ms); stacks to cards under 768px.
6. **Task Detail Drawer** — editable fields, status/priority/assignee selectors, due date, comment thread (append-only), collapsible activity log, delete. 40% panel on desktop, full-screen mobile.
7. **Settings** — profile name/email, password-change form, dark-mode toggle (persisted), logout.

## Design system (Linear/Vercel minimal)
- **Inter** font via `@fontsource/inter`.
- Near-black text on off-white; single accent; semantic colors reserved for priority/status only (Low=gray, Medium=blue, High=orange, Urgent=red). Color is never the sole signal — pair with text/icon (a11y).
- Flat cards that lift only on hover; sticky table headers; collapsible sidebar with left-accent active state.
- **Dark mode** via CSS variables + `dark:` variant, toggle persisted to `localStorage`.
- All tokens defined in `src/styles.css` (Tailwind v4 `@theme` / oklch) — no hardcoded color utilities in components.

## Reusable component & code standards (Section 22)
- Functional components, one per file, PascalCase, < ~150 lines.
- No business logic in components — data via hooks; components stay presentational.
- Typed props (TypeScript), lists keyed by stable IDs, `React.memo` only on Kanban cards.
- Forms: React Hook Form + Zod resolver, inline field errors.
- Every input has a `<label>`; icon-only buttons get `aria-label`.

## Dependencies to add
`@tanstack/react-query`, `@dnd-kit/core` + `@dnd-kit/sortable`, `recharts`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@fontsource/inter`. (shadcn/ui primitives + `lucide-react` are already available in the template.)

## Out of scope (documented as such)
No real backend/DB, no real JWT/bcrypt, no Lovable Cloud, no file uploads, no real-time. The README section in-app/notes will state the mock layer is a stand-in for the spec's REST API and where to swap it.

## Verification
After build: typecheck/build passes, then drive the live preview (Playwright) to confirm login → dashboard → create project → Kanban drag updates status optimistically → open task drawer → add comment → activity logs → list view filter/sort/bulk → dark-mode toggle persists across refresh.
