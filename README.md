# Kanban Memo App

A personal Kanban board + memo pad that runs **completely offline** — no internet, no cloud, no accounts.

- The backend (Python/SQLite) runs on your **Mac**
- The app is installed natively on your **phone**
- They talk to each other over your **local Wi-Fi** — that's it

---

## What you need

- Your Mac and phone **on the same Wi-Fi network**
- [Android Studio](https://developer.android.com/studio) (Android) **or** Xcode + Xcode Command Line Tools (iOS)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) — Python package manager
- [Node.js](https://nodejs.org/) (v18+)

---

## Step 1 — Start the backend on your Mac

```bash
chmod +x start.sh
./start.sh
```

This installs dependencies and starts the backend at **http://localhost:8000**.  
Keep this terminal open whenever you want to use the app.

---

## Step 2 — Find your Mac's local IP address

```bash
ipconfig getifaddr en0
```

You'll get something like `192.168.1.42`. Note it down.

---

## Step 3 — Build the app

```bash
cd frontend
npm install

# Replace the IP below with yours from Step 2
VITE_API_BASE_URL=http://192.168.1.42:8000 npm run build

# Sync the build into the native project
npx cap sync
```

---

## Step 4 — Install on your phone

### Android

Connect your phone via USB (enable USB Debugging in Developer Options), then:

```bash
cd frontend
npx cap run android
```

The app installs and opens on your phone automatically.

> **No USB?** Open Android Studio with `npx cap open android`, then do  
> **Build → Generate Signed APK**, transfer the `.apk` to your phone and install it.

---

### iOS

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

- Make sure the backend is running on your Mac (`./start.sh`)
- Open the app on your phone — it connects automatically over Wi-Fi
- Everything is stored locally in `backend/kanban.db` (SQLite)

> If the app can't connect, double-check that your phone and Mac are on the same Wi-Fi and that the IP in Step 3 is correct.

---

## Stack

| Layer    | Tech                                         |
|----------|----------------------------------------------|
| Backend  | Python · FastAPI · SQLAlchemy · SQLite       |
| Scheduler| APScheduler (routine tickets + reminders)    |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS  |
| Mobile   | Capacitor 6 (iOS + Android)                  |
| State    | Zustand · @dnd-kit                           |
