# Weather — iOS-style Weather app for Linux, macOS, and Windows

A pixel-faithful clone of the iOS 17+ / macOS Sonoma+ Weather app, built for
Linux desktops (primary target) with cross-platform support via Tauri 2.
Free **Open-Meteo** data (no API key required). Tauri 2 + React + TypeScript,
layered architecture (UI / service / data).

## Features

- Hero header with current temperature, condition, and today's H/L
- Condition + day/night aware animated gradient background with rain/snow particles
- Horizontally scrolling hourly forecast (24 h) with precipitation probability
- 10-day forecast with range bars between the global low/high
- Detail grid: UV, Sunrise/Sunset, Wind, Precipitation, Feels Like, Humidity, Visibility, Pressure
- **Live precipitation radar map** (RainViewer + Leaflet)
- Search & add multiple cities, switch between them, detect current location
- °C / °F toggle (auto-refreshes all cities)
- **Settings page** with persistent storage (localStorage)
- **Wayland-compatible out of the box** (see [Wayland support](#wayland-support))
- **Responsive layout**: sidebar navigation on desktop (≥900px), stacked mobile layout below

## Architecture

```
src/         # ── FRONTEND (TypeScript / React) ──
  data/        # HTTP clients + types/normalization (no React)
  services/    # weather, location, units, gradient/scene, settings, radar
  store/       # zustand state with persist middleware
  utils/       # formatting helpers
  ui/          # components + design tokens
  assets/      # SVG icons / branding
src-tauri/   # ── NATIVE SHELL (Rust / Tauri 2) ──
scripts/     # launcher helpers
packaging/   # .desktop file + distro packaging assets
```

UI → Service → Data only. No `fetch` calls in the UI layer.

## Data source

- **Forecast:** `https://api.open-meteo.com/v1/forecast` (current, hourly, 10-day)
- **Geocoding:** `https://geocoding-api.open-meteo.com/v1/search`
- **IP fallback (location detect):** `https://ipapi.co/json/`
- **Radar tiles:** `https://api.rainviewer.com` + `https://tilecache.rainviewer.com`

To swap in a paid provider, change the URL + pass your API key in Settings.

## Quick start

> **Security Note:** `npm run dev:vite` binds to `0.0.0.0` (all interfaces) by default (`host: true`), making the dev server visible to all devices on the same WiFi/local network. This is convenient for testing on phones/other devices on trusted networks, but should not be used on public or shared untrusted networks.

```bash
# Clone
git clone https://github.com/aaronwesthoff84/LinuxWeather.git
cd LinuxWeather

# Install dependencies
npm install

# Run in development (web view in browser)
npm run dev:vite

# Run native desktop window (requires Rust — see below)
npm run dev
```

## Prerequisites

### Linux (primary target)

```bash
# Ubuntu / Debian
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file \
  libappindicator-gtk3-devel librsvg2-devel
sudo dnf group install -y "C Development Tools and Libraries"

# Arch
sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget file openssl \
  libayatana-appindicator librsvg
```

### macOS

```bash
# Xcode Command Line Tools (or full Xcode)
xcode-select --install

# Rust (required for Tauri native window)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### Windows

Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) with the **Desktop development with C++** workload, then install Rust via [rustup](https://rustup.rs/).

## Build a distributable

```bash
npm run build
```

Outputs per platform:
- **Linux:** `src-tauri/target/release/bundle/appimage/*.AppImage`, `.deb`
- **macOS:** `src-tauri/target/release/bundle/dmg/*.dmg`
- **Windows:** `src-tauri/target/release/bundle/msi/*.msi`, `.exe`

## Wayland support

Tauri uses **WebKitGTK**, which has known rendering issues on Wayland
(GNOME 45+, KDE 6+, Sway, Hyprland) caused by its default DMABUF renderer.
Symptoms: black window, flickering, crashes, blurry text.

### Automatic fix

The Rust shell sets three environment variables at process start
(`src-tauri/src/main.rs`), before the webview initializes:

| Variable | Value | Why |
|---|---|---|
| `WEBKIT_DISABLE_DMABUF_RENDERER` | `1` | Disables the broken DMABUF path on WebKitGTK 2.42+ |
| `WEBKIT_DISABLE_COMPOSITING_MODE` | `1` | Fallback for older WebKitGTK on Ubuntu 22.04 / Debian stable |
| `__GL_GSYNC_ALLOWED` | `0`` | Stops NVIDIA + Wayland frame-pacing stutter |

These are only applied if the user hasn't already set them, and the entire
fixup pass can be disabled by exporting `WEATHER_APP_NO_FIXUPS=1` before
launch.

If you also need to fall back from Wayland to XWayland on a specific machine:

```bash
GDK_BACKEND=x11 weather-app
```

### Desktop launcher (.desktop entry)

`packaging/weather-app.desktop` provides a working `[Desktop Entry]` that
applies the same env vars when launched from the GNOME Activities overview,
KDE app menu, etc. Install it system-wide with:

```bash
sudo install -Dm644 packaging/weather-app.desktop \
    /usr/share/applications/weather-app.desktop
```

…or per-user:

```bash
install -Dm644 packaging/weather-app.desktop \
    ~/.local/share/applications/weather-app.desktop
update-desktop-database ~/.local/share/applications
```

### Verifying which display server you're on

```bash
echo "$XDG_SESSION_TYPE"        # 'wayland' or 'x11'
echo "$WAYLAND_DISPLAY"         # set on Wayland, unset on X11
```

## Settings

All settings are persisted to `localStorage` (survives app restarts):

| Setting | Default | Description |
|---|---|---|
| Temperature unit | °F | °C / °F toggle |
| Reduced motion | Off | Disables animated background + particles |
| Show radar | On | Toggles the precipitation radar card |
| Auto-refresh | 15 min | Background refresh interval (off / 5 / 15 / 30 / 60 min) |
| Auto-detect on first launch | On | Detects your location automatically when the app has no cities |
| API key | (empty) | Optional — only needed if you swap in a paid provider |

## License

MIT
