# Kanban Memo App

A personal Kanban board + memo pad that runs **completely offline** — no internet, no cloud, no accounts.

- Install it once on your phone via USB
- All data is stored **on the phone** — no server, no Wi-Fi required to use it
- The backend (Python/SQLite) exists for local development in a browser, not required by the phone app

---

## Features

### Kanban board
- **Columns:** Backlog → In Progress → Done
- **Drag & drop** cards between columns (web); **long-press** a card to pick a new status (mobile)
- **Hide Done** toggle to keep the board clean
- **Filter bar** — filter by Priority, Estimation, or EPIC

### Tickets
- **Priority** — P1 (critical) · P2 · P3 · P4 (low), shown as a coloured badge
- **Estimation** — Fibonacci points: 1 · 2 · 3 · 5 · 8
- **Description** — Markdown editor with live preview
- **EPICs** — coloured labels; attach multiple EPICs to a ticket
- **Routines** — tickets that auto-spawn on a daily/weekly/monthly schedule

### EPICs
- Create and delete EPICs from the **sidebar** or from inside a ticket editor
- Each EPIC is a coloured badge; deleting an EPIC removes it from all tickets automatically

### Sidebar
- **Sync** — update the app over WiFi without a USB cable (see [WiFi OTA sync](#wifi-ota-sync))
- **EPICs** — full list with create (`+`) and delete (`×`) actions
- **Notifications** — toggle daily reminder on/off; set reminder time (HH:MM)
- **Settings** — hide/show Done column; dark / light theme toggle (sun / moon)
- **Appearance** — choose an accent color from 6 presets or a custom color wheel

### Memos
- Freeform note pad, separate from the Kanban board
- Supports EPICs and Markdown

### Notifications
- Daily reminder at a configurable time
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

## Stack

| Layer    | Tech                                         |
|----------|----------------------------------------------|
| Backend  | Python · FastAPI · SQLAlchemy · SQLite       |
| Scheduler| APScheduler (routine tickets + reminders)    |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS  |
| Mobile   | Capacitor 6 (iOS + Android)                  |
| State    | Zustand · @dnd-kit                           |
