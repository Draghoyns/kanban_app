# Kanban Memo App

> **Phone-first app.** Designed primarily for iOS and Android via Capacitor. The web build works but the phone experience is the priority.

A personal Kanban board + memo pad that runs **completely offline** — no internet, no cloud, no accounts.

- Install it once on your phone via USB
- All data is stored **on the phone** — no server, no Wi-Fi required to use it
- The backend (Python/SQLite) exists for local development in a browser, not required by the phone app

---

## Features

### Kanban board
- **Columns:** Backlog → In Progress → Blocked → Today → Done
- **Drag & drop** cards between columns (web); **long-press** a card to pick a new status (mobile)
- **Drag to reorder** within a column — freely within the same priority group; priority order (P1 → P4) is always enforced
- **Hide Done** toggle to keep the board clean
- **WIP limits** — per-column limit with a visual warning when exceeded
- **Filter bar** — filter by Priority, Estimation, EPIC, or Due date (Overdue · This week · This month · No due date)
- **Search** — keyword search across all columns (title, Why, What, How); press `/` to focus
- **Weekend mode** — on Saturday and Sunday the Today column is replaced by Saturday and Sunday columns; any tickets left in Today at the start of the weekend automatically move to Backlog; on Monday a triage modal lets you drag unfinished weekend tasks to whichever column they belong in
- **Keyboard shortcuts** — `N` = new ticket, `M` = new memo, `/` = search (desktop/web); hints shown in the header
- **Swipe gestures** (mobile) — scroll horizontally between columns, vertically within a column; long-press a card to change its status
- **Undo last delete** — toast with an Undo button, ~5 s window

### Tickets
- **Priority** — P1 (critical) · P2 · P3 · P4 (low), shown as a coloured badge
- **Estimation** — Fibonacci points: 1 · 2 · 3 · 5 · 8
- **Due date** — pick a date; card badge turns amber (today), red (overdue), yellow (≤7 days), or shows the date
- **Description** — Markdown editor with live preview
- **EPICs** — coloured labels; attach multiple EPICs to a ticket
- **Routines** — tickets that auto-spawn on a daily/weekly/monthly/custom schedule; on weekends routine tickets are routed to the Saturday or Sunday column instead of Today
- **Sub-tasks** — checklist inside a ticket
- **Due date** — card badge turns amber (today), red (overdue), yellow (≤7 days)
- **Project tickets** — mark a ticket as a project, set a story-point goal, and link atomic tickets to it; the progress bar on the project card fills as linked tickets move to Done

### EPICs
- Create and delete EPICs from the **sidebar** or from inside a ticket editor
- Each EPIC is a coloured badge; deleting an EPIC removes it from all tickets automatically

### Dashboard (Kanban Wrapped)
Tap the chart icon in the top-right corner of the sidebar to open the dashboard. Pick a period — **Today**, **Week**, **Month**, or **Year** — and see:
- Total story points earned and tickets completed in that period
- Points breakdown per EPIC (coloured bars, sorted by points)
- Points breakdown by priority (P1 – P4)
- List of all done tickets for the period with their point values

### Sidebar
- **Kanban Wrapped** — chart icon in the sidebar header opens the dashboard
- **Sync** — update the app over WiFi without a USB cable (see [WiFi OTA sync](#wifi-ota-sync))
- **EPICs** — full list with create (`+`) and delete (`×`) actions
- **Notifications** — toggle daily reminder on/off; set reminder time (HH:MM)
- **Settings** — hide/show Done column; dark / light theme toggle (sun / moon)
- **Appearance** — choose an accent color from 6 presets or a custom color wheel
- **Export / Import** — export the full board as JSON for manual backup; import from a JSON backup

### Memos
- Freeform note pad, separate from the Kanban board
- Supports EPICs and Markdown
- **Pin** important memos to the top

### Notifications
- Daily reminder at a configurable time — on weekends the notification reflects the Saturday or Sunday column instead of Today
- Bell icon in the header is synchronised with the sidebar toggle

---

## How it works

There are three layers:

| Layer | Tech | What it does |
|---|---|---|
| Backend | Python (FastAPI) + SQLite | Dev-only — lets you use the app in a browser on your Mac |
| Frontend | React + TypeScript + Vite | The UI — runs in a browser during dev, compiled to static files for mobile |
| Native wrapper | Capacitor | Takes the compiled website and wraps it into an Android/iOS app |

The phone app stores everything in the phone's local storage (via Zustand `persist`). It makes no network calls — your Mac does not need to be on.

---

## What you need

- [Android Studio](https://developer.android.com/studio) (Android) **or** Xcode (iOS)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) — Python package manager
- [Node.js](https://nodejs.org/) (v18+)

---

## Step 1 — Install Android Studio and the SDK

**1a. Download and install [Android Studio](https://developer.android.com/studio)**

> **Java:** Android Studio ships with its own JDK — do not install a separate one. An older system Java will break the Gradle build. The `android/gradle.properties` in this repo already points Gradle to Android Studio's JDK automatically.

**1b. Download the Android SDK**

Android Studio is just the IDE — the SDK (the actual build tools) must be downloaded separately inside it:

1. Open Android Studio — you'll land on a welcome screen
2. Click **More Actions → SDK Manager**
   > If a project opens instead of the welcome screen: top menu → **Android Studio → Settings → Languages & Frameworks → Android SDK**
3. In the **SDK Platforms** tab: check **Android 14 (API 34)** (or the latest available)
4. In the **SDK Tools** tab: make sure these are checked:
   - Android SDK Build-Tools
   - Android SDK Command-line Tools (latest)
   - Android SDK Platform-Tools *(this includes `adb`, needed to talk to your phone)*
5. Click **Apply** and wait for the download to finish

**1c. Add the SDK to your shell**

```bash
cat >> ~/.zshrc << 'EOF'

# Android SDK
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
EOF

source ~/.zshrc
```

Open a **new terminal window** after running this, or the next steps won't find `adb`.

---

## Step 2 — Start the backend on your Mac

```bash
chmod +x start.sh
./start.sh
```

This installs Python/Node dependencies and starts the backend at **http://localhost:8000**.

> The backend is only needed for browser-based development. The phone app does not use it.

---

## Step 3 — Build the app

```bash
cd frontend
npm install
npm run build
```

This compiles the React app into static files in `frontend/dist/`.

Then sync those files into the Android project:

```bash
npx cap sync
```

> You'll see iOS-related warnings if Xcode isn't installed — ignore them.

---

## Step 4 — Prepare your Android phone

**Enable Developer Options:**
1. Settings → About phone → tap **Build number** 7 times
2. You'll see "You are now a developer!"

**Enable USB Debugging:**
- Settings → Developer options → turn on **USB debugging**

**Enable Install via USB** *(required on Xiaomi/MIUI and some other brands)*:
- Settings → Developer options → turn on **Install via USB**

Connect your phone to your Mac via USB.

> A popup will appear on your phone asking to allow USB debugging from this computer — tap **Allow**.

Verify your phone is visible:

```bash
adb devices
```

You should see your device listed as `device`. If it shows `unauthorized`, check your phone for the USB debugging approval popup and tap Allow.

---

## Step 5 — Install on your phone

```bash
cd frontend
npx cap run android
```

This compiles the native APK and installs it on your phone. The app opens automatically.

> If the command fails with `ERR_SDK_NOT_FOUND`, your terminal doesn't have `ANDROID_HOME` set — open a new terminal window and try again (the shell setup in Step 1c only takes effect in new windows).

---

## iOS

```bash
# One-time setup
cd frontend/ios/App && pod install

# Open in Xcode
cd frontend && npx cap open ios
```

In Xcode:
1. Select your phone from the device picker at the top
2. Go to **Signing & Capabilities** → set your Apple ID as the Team (free account is fine)
3. Press ▶ **Run**

---

## Using the app

- Open the app on your phone — it works offline, no Wi-Fi or Mac needed
- All data is stored on the phone itself

**Local browser development** (optional — to work on the UI without a phone):

```bash
./start.sh
```

Opens the app at `http://localhost:5173` with the Python backend at `localhost:8000`. Data is stored in `backend/kanban.db` (SQLite) and is separate from the phone's data.

---

## WiFi OTA sync

Once the app is installed on your phone, you can push updates **wirelessly** without a USB cable.

### How it works

1. You make changes and run `npm run build` on your Mac (this generates a new `dist/version.json` with a unique `bundleId`).
2. The backend (`./start.sh`) serves two new endpoints:
   - `GET /sync/version` — returns the current build's `bundleId`
   - `GET /sync/bundle.zip` — streams the full `dist/` directory as a zip
3. On the phone, open the **sidebar → Sync**, enter your Mac's local IP (e.g. `http://192.168.1.x:8000`), and tap **Sync now**.
4. The app checks the version, downloads the zip if it differs, applies it, and reloads automatically.
5. The new bundle is stored on-device — the app keeps working fully **offline** after syncing.

### Workflow

```bash
# 1. Edit code on your Mac, then build
cd frontend
npm run build

# 2. Make sure the backend is running
./start.sh          # from the repo root

# 3. Find your Mac's local IP
ipconfig getifaddr en0   # e.g. 192.168.1.42

# 4. On the phone:
#    Sidebar → Sync → set URL to http://192.168.1.42:8000 → tap 'Sync now'
```

> **One-time requirement:** The `@capawesome/capacitor-live-update` native plugin must be present in the installed APK. The first deploy via USB (`npx cap run android`) installs it. All subsequent updates can be done wirelessly.

---

## Todo / Ideas

### Board
- [ ] Multiple boards (e.g. Work, Personal, Side projects)
- [ ] Custom columns (rename, add, delete, reorder)
- [ ] Archive column for done tickets instead of deleting
- [ ] Light/dark mode follows system automatically (currently manual)
- [ ] Zoom out the phone icon to show the whole cherry
- [x] Android back button closes open modal/sidebar instead of quitting the app

### EPICs
- [ ] EPIC progress bar showing % of tickets done (opt-in per EPIC at creation time)
- [x] Prevent duplicate EPIC names
- [x] Edit EPIC name and color from the sidebar

### Memos
- [ ] Attach a memo to a specific ticket
- [x] EPIC filters below the search bar

### Routines
- [ ] Postpone / skip a single routine instance without deleting the routine
- [x] Prune done routine instances older than N days (unbounded store growth)
- [x] Dynamic countdown badge on routine tickets (X days left before next occurrence)

### Notifications
- [ ] Per-ticket reminders (remind me on due date)
- [x] Remove notifications button from sidebar — bell icon in header only
- [x] Notification tap switches to Kanban tab before scrolling to column
- [x] Show ticket titles line-by-line in the notification body

### Sync / data
- [ ] Conflict resolution when syncing from multiple devices
- [ ] iCloud / Google Drive backup (native Capacitor plugin)
- [ ] Version picker — name every change by importance (minor / major)

---

## Stack

| Layer    | Tech                                         |
|----------|----------------------------------------------|
| Backend  | Python · FastAPI · SQLAlchemy · SQLite       |
| Scheduler| APScheduler (routine tickets + reminders)    |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS  |
| Mobile   | Capacitor 6 (iOS + Android)                  |
| State    | Zustand · @dnd-kit                           |
