# TaskFlow — Frontend-Only Build Plan (Custom Components, No UI Library)

A production-grade **frontend only** implementation of the TaskFlow spec. No backend, no Lovable Cloud. **No shadcn/Radix or any component library** — every reusable UI primitive is hand-built with Tailwind, exactly as Section 12/22 of the spec prescribes. All data flows through a clean, swappable mock API layer persisted to `localStorage`, so the logic layer (hooks, validation, state) is real and defensible.

## Hard constraints from the user
- **No external UI library** (no shadcn, no Radix). Build own `Button`, `Input`, `Textarea`, `Select`, `Modal`, `Drawer`, `Badge`, `Avatar`, `Skeleton`, `Checkbox`, `Tabs`, `Tooltip`, `Spinner` from scratch.
- **Code must read as human-written** — clear names, small focused files, comments only where they earn their place, no generated-looking boilerplate.
- **Clean, Linear/Vercel-minimal UI** as the docs describe.

## Scope (full spec, frontend)
Auth (Login/Register, mock JWT) · Dashboard (stats + charts) · Projects list (CRUD) · Project Detail Kanban (drag-and-drop, optimistic) · List view (sort/filter/bulk) · Task Detail drawer (edit, comments, activity log) · Settings (profile, password, theme).

## Architecture
Runs on the existing **TanStack Start (React 19)** stack. Every frontend principle from Section 12/22 is honored: feature folders, reusable hand-built UI, TanStack Query for server state, Context for auth, React Hook Form + Zod for forms, absolute `@/` imports.

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
│   ├── ui/              # HAND-BUILT: Button, Input, Textarea, Select, Modal, Drawer,
│   │                    #   Badge, Avatar, Skeleton, Checkbox, Tabs, Tooltip, Spinner, Field
│   ├── layout/          # AppLayout, Sidebar, Topbar (collapsible, bottom nav on mobile)
│   ├── dashboard/       # StatCard, StatusDonut, CompletionsBar, ActivityFeed, DeadlinesList
│   ├── projects/        # ProjectCard, ProjectFormModal
│   ├── tasks/           # TaskCard, TaskDrawer, TaskForm, TaskTableRow, FilterBar
│   └── kanban/          # KanbanBoard, KanbanColumn
└── routes/              # TanStack file routes
```

### Custom UI primitives (replacing shadcn)
- Built with `class-variance-authority` + `cn()` (already present, not a UI lib) for variant styling, plain semantic markup, and full keyboard/focus/`aria` handling written by hand.
- `Modal`/`Drawer`: own implementation using a portal, `Escape` to close, focus trap, backdrop click, body scroll lock.
- `Select`/`Checkbox`/`Tabs`: native-element-based where possible (real `<select>`, `<input type=checkbox>`) for accessibility and honest, explainable code.
- `Tooltip`: lightweight CSS/JS hover/focus implementation.
- The pre-existing `src/components/ui/*` shadcn files are not imported by any TaskFlow code; I'll keep the app importing only the hand-built primitives. (Charts use Recharts directly — a charting lib, allowed by the spec, not a component kit.)

### State management
- **TanStack Query** for all "server" data — caching, loading/error, and **optimistic updates with rollback** for the Kanban drag.
- **AuthContext** for the mock session only. `useState` for local UI state.

### Mock API + persistence
- `lib/mock/store.ts` seeds Users/Projects/Tasks/Comments/Activity into `localStorage` on first load.
- `lib/api/*.ts` exposes async functions (`getProjects`, `createTask`, `updateTask`, `getDashboardSummary`, …) reading/writing the store with a small artificial delay so skeletons and optimistic UI are demonstrable.
- Mutations auto-write **activity log** entries on status/priority/assignee change and keep `commentCount` in sync — mirroring the spec's transaction behavior client-side.
- Mock auth: register/login validate against the store, issue a fake token to `localStorage`; protected routes redirect to `/login`.

## Routes
```text
/login                      Login + Register tab toggle (public)
/_authenticated/            layout: Sidebar + Topbar, redirects out if no token
  index (/)                 Dashboard
  projects                  Projects list
  projects/$projectId       Project Detail — Kanban (default) + List toggle, Task drawer
  settings                  Settings
```
Each route gets its own `head()` metadata; root keeps `<Outlet/>` intact.

## Pages
1. **Login/Register** — tabbed card, centered, RHF+Zod inline validation on blur, spinner + toast on error.
2. **Dashboard** — 4 stat cards (Active, Due This Week, Overdue [red], Completed This Month), Recharts donut + 7-day completions bar, Recent Activity feed, Upcoming Deadlines, Quick Actions; skeletons + empty state.
3. **Projects List** — responsive card grid, search, create/edit modal (name 3–100 required, optional desc/due date), skeleton + empty CTA.
4. **Project Detail / Kanban** — 4 fixed columns via **@dnd-kit** (a drag utility, not a UI kit), optimistic move + rollback toast, quick-add task, filter bar, view toggle. Cards: priority strip, due-date badge (red if overdue), assignee avatar, label chips, comment count. Horizontal scroll on mobile.
5. **List View** — sortable/filterable table, checkbox bulk-select (bulk status change/delete), debounced search (300ms); stacks to cards under 768px.
6. **Task Detail Drawer** — editable fields, status/priority/assignee selectors, due date, comment thread (append-only), collapsible activity log, delete. 40% panel desktop, full-screen mobile.
7. **Settings** — profile name/email, password-change form, dark-mode toggle (persisted), logout.

## Design system (Linear/Vercel minimal)
- **Inter** via `@fontsource/inter`.
- Near-black text on off-white; single accent; semantic colors reserved for priority/status only (Low=gray, Medium=blue, High=orange, Urgent=red). Color never the sole signal — paired with text/icon.
- Flat cards lifting only on hover; sticky table headers; collapsible sidebar with left-accent active state.
- **Dark mode** via CSS variables + `dark:` variant, toggle persisted to `localStorage`.
- All tokens in `src/styles.css` (Tailwind v4 `@theme`/oklch) — no hardcoded color utilities in components.

## Code standards (Section 22)
Functional components, one per file, PascalCase, < ~150 lines · no business logic in components (data via hooks) · typed props · lists keyed by stable IDs · `React.memo` only on Kanban cards · RHF + Zod with inline field errors · every input has a `<label>`, icon-only buttons get `aria-label`.

## Dependencies
Already present: `@tanstack/react-query`, `recharts`, `react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`, `lucide-react` (icons), `sonner` (toasts), `class-variance-authority`. Added: `@dnd-kit/*`, `@fontsource/inter`. **No new component library.**

## Out of scope (documented as such)
No real backend/DB, no real JWT/bcrypt, no Lovable Cloud, no file uploads, no real-time. The mock layer is an explicit stand-in for the spec's REST API.

## Verification
Build/typecheck passes, then drive the live preview (Playwright): login → dashboard → create project → Kanban drag updates status optimistically → open task drawer → add comment → activity logs → list filter/sort/bulk → dark-mode persists across refresh.
