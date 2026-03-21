# Kanban Memo App

A personal Kanban board + memo pad that runs **completely offline** — no internet, no cloud, no accounts.

- The backend (Python/SQLite) runs on your **Mac**
- The app is installed natively on your **phone**
- They talk to each other over your **local Wi-Fi** — that's it

---

## How it works

There are three layers:

| Layer | Tech | What it does |
|---|---|---|
| Backend | Python (FastAPI) + SQLite | Stores all your data, runs on your Mac |
| Frontend | React + TypeScript + Vite | The UI — runs in a browser during dev, compiled to static files for mobile |
| Native wrapper | Capacitor | Takes the compiled website and wraps it into an Android/iOS app |

The app on your phone is a WebView (a browser in disguise) loading local files. It calls your Mac's backend over Wi-Fi.

---

## What you need

- Your Mac and phone **on the same Wi-Fi network**
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
Keep this terminal open whenever you want to use the app.

---

## Step 3 — Find your Mac's local IP address

```bash
ipconfig getifaddr en0
```

You'll get something like `192.168.1.42`. Note it down — this is the address your phone will use to reach the backend.

---

## Step 4 — Build the app

```bash
cd frontend
npm install

# Replace the IP below with yours from Step 3
VITE_API_BASE_URL=http://192.168.1.42:8000 npm run build
```

This compiles the React app into static files in `frontend/dist/`.

Then sync those files into the Android project:

```bash
npx cap sync
```

> You'll see iOS-related warnings if Xcode isn't installed — ignore them.

> **Why `VITE_API_BASE_URL`?** During dev, the browser and backend are both on `localhost` so no IP is needed. On the phone, `localhost` means the phone itself, so you have to hardcode your Mac's LAN IP at build time.

---

## Step 5 — Prepare your Android phone

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

## Step 6 — Install on your phone

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

- Make sure the backend is running on your Mac (`./start.sh`)
- Open the app on your phone — it connects automatically over Wi-Fi
- Everything is stored locally in `backend/kanban.db` (SQLite)

> If the app can't connect, double-check that your phone and Mac are on the same Wi-Fi and that the IP in Step 4 is correct.

---

## Stack

| Layer    | Tech                                         |
|----------|----------------------------------------------|
| Backend  | Python · FastAPI · SQLAlchemy · SQLite       |
| Scheduler| APScheduler (routine tickets + reminders)    |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS  |
| Mobile   | Capacitor 6 (iOS + Android)                  |
| State    | Zustand · @dnd-kit                           |
