#!/usr/bin/env bash
# Wayland-compatible launcher for the Weather AppImage / installed binary.
#
# Usage:
#   ./scripts/run-weather.sh [path-to-binary-or-appimage]
#
# If no argument is given, this script tries (in order):
#   1. ./Weather.AppImage in the current directory
#   2. /usr/bin/weather-app (system install)
#   3. ./src-tauri/target/release/weather-app (dev build)
#
# The Rust binary already applies these env vars internally, but this script
# is handy when users want to override them (e.g., re-enable DMABUF on a
# system where it works), or for testing the same env on a manual build.

set -euo pipefail

# Disable WebKitGTK's DMABUF renderer (the #1 Wayland compatibility issue).
export WEBKIT_DISABLE_DMABUF_RENDERER="${WEBKIT_DISABLE_DMABUF_RENDERER:-1}"

# Older WebKitGTK shipped on Ubuntu 22.04 / Debian stable.
export WEBKIT_DISABLE_COMPOSITING_MODE="${WEBKIT_DISABLE_COMPOSITING_MODE:-1}"

# NVIDIA + Wayland frame-pacing fix.
export __GL_GSYNC_ALLOWED="${__GL_GSYNC_ALLOWED:-0}"

# Resolve binary
if [ "$#" -ge 1 ]; then
  BIN="$1"
elif [ -x "./Weather.AppImage" ]; then
  BIN="./Weather.AppImage"
elif [ -x "/usr/bin/weather-app" ]; then
  BIN="/usr/bin/weather-app"
elif [ -x "./src-tauri/target/release/weather-app" ]; then
  BIN="./src-tauri/target/release/weather-app"
else
  echo "Could not find Weather binary. Pass a path as the first argument." >&2
  exit 1
fi

echo "Launching: $BIN"
echo "  WEBKIT_DISABLE_DMABUF_RENDERER=$WEBKIT_DISABLE_DMABUF_RENDERER"
echo "  WEBKIT_DISABLE_COMPOSITING_MODE=$WEBKIT_DISABLE_COMPOSITING_MODE"
exec "$BIN" "$@"
