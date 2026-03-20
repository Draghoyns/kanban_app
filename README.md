# Kanban Memo App

A full-stack **Kanban + Memo** productivity app with:

- **Kanban board** — tickets with statuses: Backlog · In Progress · Blocked · Today · Done
- **Memo pad** — freeform notes with colours & pinning
- **Tags** — colour-coded labels on both tickets and memos
- **Routine tickets** — auto-generated on a schedule (daily, weekdays, specific days, every N days)
- **Push notifications** — daily reminders about Today tickets
- **Native iOS & Android apps** via Capacitor

---

## Stack

| Layer    | Tech                                         |
|----------|----------------------------------------------|
| Backend  | Python · FastAPI · SQLAlchemy · SQLite       |
| Scheduler| APScheduler                                  |
| Web Push | pywebpush (VAPID)                            |
| Native Push | firebase-admin (FCM → Android + iOS)     |
| Frontend | React 18 · TypeScript · Vite                 |
| Styling  | Tailwind CSS                                 |
| DnD      | @dnd-kit                                     |
| State    | Zustand                                      |
| Mobile   | Capacitor 6 (iOS + Android)                  |

---

## Quick start (web only)

```bash
chmod +x start.sh
./start.sh
```

Opens backend on **http://localhost:8000** and dev server on **http://localhost:5173**.

---

## Manual start

### Backend
```bash
cd backend
uv sync        # creates .venv and installs deps
uv run python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Building the mobile app

### Prerequisites

| Target   | Tool needed                                                      |
|----------|------------------------------------------------------------------|
| Android  | [Android Studio](https://developer.android.com/studio)           |
| iOS      | Xcode (App Store) + `sudo gem install cocoapods` + `pod install` |

Both `android/` and `ios/` project folders are already scaffolded.

---

### Step 1 — Tell the app where the backend is

The native app cannot use `localhost`; it needs your backend's real network address.

**Option A — Same network (simplest, for personal use)**

1. Find your computer's local IP: `ipconfig getifaddr en0`
2. Ensure your phone is on the same Wi-Fi
3. Create `frontend/.env` from the example:

```bash
cp frontend/.env.example frontend/.env
# Edit VITE_API_BASE_URL=http://192.168.x.x:8000
```

**Option B — Deployed backend**

Set `VITE_API_BASE_URL=https://your-server.com` and run the backend there.

**Option C — Live reload (dev only)**

Skip the build step; point Capacitor at the running Vite dev server:
```bash
# In terminal 1 — Vite proxies /api → backend, so this just works
npm run dev

# In terminal 2
CAP_DEV_SERVER=http://192.168.x.x:5173 npx cap sync
npx cap run android   # or ios
```

---

### Step 2 — Build and sync

```bash
cd frontend

# Build the web bundle
VITE_API_BASE_URL=http://192.168.x.x:8000 npm run build

# Sync assets + plugins into native projects
npx cap sync
```

---

### Step 3 — Run on device

#### Android

```bash
# Open in Android Studio — connect device or use emulator
npx cap open android
```

Or run directly (requires ADB device connected):
```bash
npx cap run android
```

To install as an APK without Android Studio:
```bash
# Inside Android Studio: Build → Generate Signed APK
# Or via Gradle:
cd frontend/android && ./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
# Transfer to phone and install (Settings → Install unknown apps)
```

#### iOS

```bash
# Install CocoaPods dependencies first (one-time)
cd frontend/ios/App && pod install

# Open in Xcode
cd frontend && npx cap open ios
```

In Xcode:
1. Select your device in the top bar
2. Set your Team (Preferences → Accounts → Apple ID — free tier allows direct device install)
3. Press ▶ Run

---

## Push notifications (optional)

### Web Push (browser / PWA)
Works out of the box — VAPID keys are auto-generated on first backend start.

### Native Push (Android + iOS via Firebase)

Requires a Firebase project:

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → create a project
2. **Android**: Add Android app → download `google-services.json` → place in `frontend/android/app/`
3. **iOS**: Add iOS app → download `GoogleService-Info.plist` → add to Xcode project
4. Project settings → Service accounts → Generate new private key → save as `backend/firebase-service-account.json`
5. Install Firebase backend extra:
   ```bash
   cd backend && uv sync --extra firebase
   ```
6. Set env var and restart backend:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json uv run python run.py
   ```

The daily 08:00 UTC scheduler job then pushes to both web subscribers and native devices.

---

## Project structure

```
kanban_app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + VAPID setup
│   │   ├── models.py        # SQLAlchemy models (Ticket, Memo, Tag, PushTokens)
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── scheduler.py     # APScheduler + FCM sender
│   │   ├── database.py      # SQLite engine
│   │   └── routers/
│   │       ├── tickets.py
│   │       ├── memos.py
│   │       ├── tags.py
│   │       └── notifications.py
│   ├── pyproject.toml       # uv / Python deps
│   └── run.py
├── frontend/
│   ├── android/             # Native Android project (open in Android Studio)
│   ├── ios/                 # Native iOS project (open in Xcode)
│   ├── public/sw.js         # Service worker (web push)
│   ├── capacitor.config.ts  # Capacitor config
│   └── src/
│       ├── components/
│       │   ├── KanbanBoard.tsx
│       │   ├── TicketCard.tsx / TicketModal.tsx
│       │   ├── MemoTab.tsx / MemoCard.tsx / MemoModal.tsx
│       │   └── layout/Header.tsx
│       ├── hooks/
│       │   └── usePushNotifications.ts  # Web + native push unified
│       ├── store/useStore.ts
│       ├── api/client.ts
│       └── types/index.ts
└── start.sh
```

---

## API docs

- Swagger UI: http://localhost:8000/docs
- ReDoc:      http://localhost:8000/redoc

### Manual notification triggers (testing)
```
POST /api/notifications/trigger-routines
POST /api/notifications/trigger-reminders
```

A full-stack **Kanban + Memo** productivity app with:

- **Kanban board** — tickets with statuses: Backlog · In Progress · Blocked · Today · Done
- **Memo pad** — freeform notes with colours & pinning
- **Tags** — colour-coded labels on both tickets and memos
- **Routine tickets** — auto-generated on a schedule (daily, weekdays, specific days, every N days)
- **Push notifications** — daily reminders about Today tickets (web push via service worker)

---

## Stack

| Layer    | Tech                                    |
|----------|-----------------------------------------|
| Backend  | Python · FastAPI · SQLAlchemy · SQLite  |
| Scheduler| APScheduler                             |
| Push     | pywebpush (VAPID / Web Push)            |
| Frontend | React 18 · TypeScript · Vite            |
| Styling  | Tailwind CSS                            |
| DnD      | @dnd-kit                                |
| State    | Zustand                                 |

---

## Quick start

```bash
chmod +x start.sh
./start.sh
```

This will:
1. Create a Python virtual-env in `backend/.venv`
2. Install Python and Node dependencies
3. Start the FastAPI backend on **http://localhost:8000**
4. Start the Vite dev server on **http://localhost:5173**

Open **http://localhost:5173** in your browser.

---

## Manual start

### Backend
```bash
cd backend
uv sync        # creates .venv and installs deps
uv run python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Project structure

```
kanban_app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + VAPID setup
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── scheduler.py     # APScheduler jobs
│   │   ├── database.py      # SQLite engine
│   │   └── routers/
│   │       ├── tickets.py
│   │       ├── memos.py
│   │       ├── tags.py
│   │       └── notifications.py
│   ├── requirements.txt
│   └── run.py
└── frontend/
    ├── public/sw.js          # Service worker (push)
    └── src/
        ├── components/
        │   ├── KanbanBoard.tsx
        │   ├── KanbanColumn.tsx
        │   ├── TicketCard.tsx
        │   ├── TicketModal.tsx
        │   ├── MemoTab.tsx
        │   ├── MemoCard.tsx
        │   ├── MemoModal.tsx
        │   └── TagBadge.tsx
        ├── store/useStore.ts  # Zustand store
        ├── api/client.ts      # Axios wrappers
        └── types/index.ts     # Shared types
```

---

## Features in detail

### Tickets
- Five status columns; drag cards between them
- Click any card to edit title, description, status, tags, and frequency
- **Routine tickets** live in Backlog as templates; the scheduler auto-creates a "Today" copy on the right days
- Frequency options: every day · every weekday · specific days of the week · every N days

### Memos
- Grid layout with masonry-style cards
- Per-card colour theming
- Pin important memos to keep them at the top
- Full-text search + tag filtering

### Push notifications (browser)
1. Click **Enable notifications** in the header
2. Grant permission when prompted
3. VAPID keys are auto-generated on first backend start and stored in `backend/vapid_private.pem` / `vapid_public.txt`
4. The scheduler sends a push at **08:00 UTC** each day summarising Today tickets (or a reminder to fill the column if empty)
5. Routine tickets are generated at **00:05 UTC** each day

### Manual trigger (testing)
```
POST /api/notifications/trigger-routines
POST /api/notifications/trigger-reminders
```
Or use the interactive docs at **http://localhost:8000/docs**.

---

## API docs

FastAPI provides auto-generated docs:

- Swagger UI: http://localhost:8000/docs
- ReDoc:      http://localhost:8000/redoc
