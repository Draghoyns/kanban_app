---
description: "Use when adding features, navigating the codebase, creating new files, or understanding how the project is organized. Covers architecture, stack, file locations, and conventions."
---
# Project Structure

## What This App Is

A personal productivity Kanban board with a memo pad. Runs as a **native mobile app** (iOS/Android via Capacitor). All data persists locally on-device via Zustand + localStorage — no accounts, no cloud sync required. The backend is only used during browser-based development.

## Architecture

```
Mobile:  React SPA → Vite build → Capacitor bridge → Android/iOS APK/IPA
Browser: React SPA (npm run dev) ↔ FastAPI backend (localhost:8000)
```

## Backend (`backend/`)

**Stack:** Python 3.11+, FastAPI, SQLite, SQLAlchemy ORM, Pydantic, APScheduler, PyWebPush

| Path | Purpose |
|------|---------|
| `app/main.py` | FastAPI app setup, CORS, router inclusion, lifespan (DB init, scheduler) |
| `app/models.py` | SQLAlchemy ORM models: `Ticket`, `Memo`, `Tag`, `NotificationSubscription`, `DevicePushToken` |
| `app/schemas.py` | Pydantic request/response schemas |
| `app/database.py` | SQLite engine + session setup |
| `app/scheduler.py` | APScheduler for daily routine ticket spawning |
| `app/routers/tickets.py` | CRUD for tickets + routine logic |
| `app/routers/memos.py` | CRUD for memos |
| `app/routers/tags.py` | CRUD for tags (EPICs) |
| `app/routers/notifications.py` | WebPush subscriptions + scheduling |
| `app/routers/sync.py` | WiFi OTA update endpoint |

All routes are prefixed `/api/`. Start with `./start.sh` or `just dev`.

### Key Data Models

- **Ticket** — title, description, status (7 values), priority (P1–P4), estimation (Fibonacci points), due_date, is_routine, frequency config, parent_id, position
- **Memo** — title, content, color, pinned
- **Tag** — name, color; many-to-many join with tickets and memos

## Frontend (`frontend/src/`)

**Stack:** React 18, TypeScript, Vite, Zustand, Tailwind CSS, dnd-kit (drag-drop), Capacitor 6, Axios, date-fns, lucide-react

| Path | Purpose |
|------|---------|
| `App.tsx` | Root: renders Header + active tab + Sidebar; handles lifecycle hooks |
| `types/index.ts` | All TypeScript types and enums (`TicketStatus`, `FrequencyType`, interfaces, constants) |
| `store/useStore.ts` | Zustand store — all app state + actions, persisted to localStorage |
| `hooks/useLiveUpdate.ts` | Polls backend for OTA sync |
| `hooks/useLocalNotifications.ts` | Capacitor LocalNotifications wrapper |

### Component Map

| Component | Role |
|-----------|------|
| `KanbanBoard.tsx` | 5-column board (Backlog → Done) with dnd-kit drag-drop |
| `KanbanColumn.tsx` | Single Kanban column |
| `TicketCard.tsx` | Ticket card displayed in column |
| `TicketModal.tsx` | Create/edit ticket form |
| `MemoTab.tsx` | Memo list + editor |
| `MemoCard.tsx` | Single memo card |
| `MemoModal.tsx` | Create/edit memo form |
| `RoutineTab.tsx` | Routine template management |
| `DashboardPage.tsx` | Analytics ("Kanban Wrapped") |
| `ProjectTab.tsx` | Project/EPIC hierarchy view |
| `Sidebar.tsx` | Navigation drawer + settings (theme, notifications, tags, import/export) |
| `FilterBar.tsx` | Tag + status filters |
| `TagBadge.tsx` | Reusable tag chip |
| `MarkdownField.tsx` | Markdown text input |
| `layout/Header.tsx` | Top bar with tab navigation |
| `WeekendCleanupModal.tsx` | Weekend ticket management modal |

### State Shape (Zustand)

- **Entities:** `tickets[]`, `memos[]`, `tags[]`
- **UI:** `activeTab` (kanban|memo|routine|dashboard|project), `sidebarOpen`, `hideDone`, `focusedColumn`
- **Settings:** `theme`, `accentColor`, `backendUrl`, `notificationsEnabled`, `notificationHour/Minute`, `wipLimits`
- **Triggers:** `newTicketTrigger`, `newMemoTrigger` (integer incremented to open create modals)

### Types to Know

```ts
type TicketStatus = 'backlog' | 'in_progress' | 'blocked' | 'today' | 'saturday' | 'sunday' | 'done'
type FrequencyType = 'daily' | 'weekly' | 'interval' | 'weekdays'
```

Constants `STATUSES`, `PRIORITY_LEVELS`, `ESTIMATION_SIZES`, `WEEKDAYS` in `types/index.ts` carry colors and display labels — use them instead of hardcoding.

## Running the Project

```bash
just dev        # Start backend (browser dev)
just android    # Build + deploy to USB-connected Android device
just ios        # Open iOS project in Xcode
just sync       # Build + start backend for WiFi OTA sync
just build      # Compile React (frontend/dist/)
```

Frontend dev server (separate): `cd frontend && npm run dev`
