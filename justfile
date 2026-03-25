# Kanban App — task runner
# Install just: brew install just

# Build the frontend and start the backend (WiFi OTA sync workflow)
sync:
    cd frontend && npm run build
    ./start.sh

# Start the backend + dev server only (no build)
dev:
    ./start.sh

# Build the frontend only
build:
    cd frontend && npm run build

# Sync native assets to Android/iOS projects (after a build)
cap-sync:
    cd frontend && npx cap sync

# Install app on a connected Android device via USB
android:
    cd frontend && npm run build && npx cap sync android
    cd frontend/android && ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew assembleDebug
    "$HOME/Library/Android/sdk/platform-tools/adb" install -r frontend/android/app/build/outputs/apk/debug/app-debug.apk
    # Clear LiveUpdate cached bundles so the fresh APK assets are loaded
    "$HOME/Library/Android/sdk/platform-tools/adb" shell run-as com.portfolio.kanbanmemo rm -rf /data/data/com.portfolio.kanbanmemo/files/_capacitor_live_update_bundles || true
    "$HOME/Library/Android/sdk/platform-tools/adb" shell run-as com.portfolio.kanbanmemo rm -f /data/data/com.portfolio.kanbanmemo/shared_prefs/CapWebViewSettings.xml || true

# Open the iOS project in Xcode
ios:
    cd frontend && npx cap open ios

# List connected Android devices
devices:
    export ANDROID_HOME="$HOME/Library/Android/sdk" && \
    "$HOME/Library/Android/sdk/platform-tools/adb" devices

# Install frontend dependencies
install:
    cd frontend && npm install

# Show your Mac's local IP (for OTA sync URL)
ip:
    ipconfig getifaddr en0
