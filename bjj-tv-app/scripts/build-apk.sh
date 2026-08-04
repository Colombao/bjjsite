#!/usr/bin/env bash
# Gera APK release local (celular + Android TV).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

if [ ! -d android ]; then
  CI=1 npx expo prebuild --platform android
fi

# TV leanback (prebuild do Expo não gera isso de forma confiável)
MANIFEST=android/app/src/main/AndroidManifest.xml
if ! grep -q 'LEANBACK_LAUNCHER' "$MANIFEST"; then
  echo "Aviso: adicione LEANBACK_LAUNCHER e uses-feature TV no AndroidManifest."
fi

cd android
chmod +x gradlew
./gradlew assembleRelease --no-daemon

APK="app/build/outputs/apk/release/app-release.apk"
mkdir -p ../dist
cp "$APK" ../dist/heishikan-arena-v1.0.0.apk
ls -lh ../dist/heishikan-arena-v1.0.0.apk
echo "OK → dist/heishikan-arena-v1.0.0.apk"
