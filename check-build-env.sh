#!/usr/bin/env bash
# check-build-env.sh — see what's installed vs what you'd download
# Run from inside your Expo/RN project directory

set -u

# Colors
G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; B='\033[0;34m'; D='\033[0;90m'; N='\033[0m'

OK="${G}✓${N}"; NO="${R}✗${N}"; MAYBE="${Y}~${N}"

TOTAL_NEEDED=0

human() {
  # bytes → human-readable
  numfmt --to=iec --suffix=B "$1" 2>/dev/null || echo "${1}B"
}

dir_size() {
  [ -d "$1" ] && du -sb "$1" 2>/dev/null | awk '{print $1}' || echo 0
}

add_need() {
  TOTAL_NEEDED=$((TOTAL_NEEDED + $1))
}

echo -e "${B}━━━ Local Android Build Environment Check ━━━${N}"
echo -e "${D}Project: $(pwd)${N}"
echo

# ---------- Node + npm ----------
if command -v node >/dev/null; then
  NV=$(node -v)
  echo -e "$OK Node.js $NV"
  MAJOR=$(echo "$NV" | sed 's/v\([0-9]*\).*/\1/')
  if [ "$MAJOR" -gt 22 ]; then
    echo -e "  ${Y}⚠ Node >22 may break eas-cli. Consider: nvm use 20${N}"
  fi
else
  echo -e "$NO Node.js missing (~30MB)"
  add_need 30000000
fi

# ---------- JDK ----------
if command -v javac >/dev/null; then
  JV=$(javac -version 2>&1 | awk '{print $2}')
  JMAJOR=$(echo "$JV" | cut -d. -f1)
  if [ "$JMAJOR" = "17" ]; then
    echo -e "$OK JDK 17 ($JV)"
  else
    echo -e "$MAYBE JDK $JV installed, but Android needs 17"
    echo -e "  ${D}sudo apt install openjdk-17-jdk  (~150MB)${N}"
    add_need 150000000
  fi
else
  echo -e "$NO JDK missing (~150MB download)"
  add_need 150000000
fi

# ---------- Android SDK ----------
SDK_PATHS=("${ANDROID_HOME:-}" "$HOME/Android/Sdk" "$HOME/Library/Android/sdk")
SDK_FOUND=""
for p in "${SDK_PATHS[@]}"; do
  [ -n "$p" ] && [ -d "$p" ] && SDK_FOUND="$p" && break
done

if [ -n "$SDK_FOUND" ]; then
  SIZE=$(dir_size "$SDK_FOUND")
  echo -e "$OK Android SDK at $SDK_FOUND ($(human $SIZE))"

  # Sub-checks
  [ -d "$SDK_FOUND/platform-tools" ] \
    && echo -e "  $OK platform-tools" \
    || { echo -e "  $NO platform-tools (~15MB)"; add_need 15000000; }

  [ -d "$SDK_FOUND/build-tools" ] && [ -n "$(ls -A "$SDK_FOUND/build-tools" 2>/dev/null)" ] \
    && echo -e "  $OK build-tools: $(ls "$SDK_FOUND/build-tools" | tr '\n' ' ')" \
    || { echo -e "  $NO build-tools (~60MB)"; add_need 60000000; }

  if [ -d "$SDK_FOUND/platforms" ] && [ -n "$(ls -A "$SDK_FOUND/platforms" 2>/dev/null)" ]; then
    echo -e "  $OK platforms: $(ls "$SDK_FOUND/platforms" | tr '\n' ' ')"
  else
    echo -e "  $NO no platforms installed (~100MB per version)"
    add_need 100000000
  fi

  # NDK
  if [ -d "$SDK_FOUND/ndk" ] && [ -n "$(ls -A "$SDK_FOUND/ndk" 2>/dev/null)" ]; then
    NDK_SIZE=$(dir_size "$SDK_FOUND/ndk")
    echo -e "  $OK NDK installed ($(human $NDK_SIZE))"
  else
    echo -e "  $MAYBE NDK not installed (~1GB if your project needs it)"
    echo -e "    ${D}check after prebuild: grep ndkVersion android/build.gradle${N}"
  fi
else
  echo -e "$NO Android SDK missing (~400-500MB for minimum setup)"
  add_need 450000000
fi

# ---------- Gradle cache ----------
GRADLE_CACHE="$HOME/.gradle/caches"
if [ -d "$GRADLE_CACHE" ]; then
  GS=$(dir_size "$GRADLE_CACHE")
  if [ "$GS" -gt 100000000 ]; then
    echo -e "$OK Gradle cache exists ($(human $GS)) — subsequent builds mostly offline"
  else
    echo -e "$MAYBE Gradle cache tiny ($(human $GS)) — first build will pull ~800MB-1GB"
    add_need 900000000
  fi
else
  echo -e "$NO No Gradle cache — first build will pull ~800MB-1GB"
  add_need 900000000
fi

# ---------- Project: node_modules ----------
if [ -d "node_modules" ]; then
  NM=$(dir_size "node_modules")
  echo -e "$OK node_modules present ($(human $NM))"
else
  echo -e "$NO node_modules missing — run: ${D}npm install${N} (~300-600MB)"
  add_need 400000000
fi

# ---------- Project: android/ prebuild output ----------
if [ -d "android" ]; then
  echo -e "$OK android/ folder exists (prebuild done)"
else
  echo -e "$MAYBE android/ folder missing — run: ${D}npx expo prebuild --platform android${N}"
  echo -e "  ${D}(downloads any extra Expo modules, usually <50MB)${N}"
fi

# ---------- eas-cli ----------
if command -v eas >/dev/null; then
  echo -e "$OK eas-cli installed ($(eas --version 2>&1 | head -1))"
else
  echo -e "${D}~ eas-cli not global (fine if using npx, or local builds only)${N}"
fi

# ---------- Disk space ----------
echo
AVAIL=$(df --output=avail -B1 "$HOME" 2>/dev/null | tail -1)
[ -n "$AVAIL" ] && echo -e "${D}Free space in \$HOME: $(human $AVAIL)${N}"

# ---------- Summary ----------
echo
echo -e "${B}━━━ Summary ━━━${N}"
if [ "$TOTAL_NEEDED" -eq 0 ]; then
  echo -e "${G}You're fully set up. First build downloads ~0 MB.${N}"
else
  echo -e "Estimated fresh download needed: ${Y}~$(human $TOTAL_NEEDED)${N}"
  echo -e "${D}(After this, per-build data is ~0 — everything caches locally.)${N}"
fi
echo
