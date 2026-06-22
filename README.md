# Weather — iOS-style Weather app for Linux

A pixel-faithful clone of the iOS 17+ / macOS Sonoma+ Weather app, built for
Linux desktops. Free **Open-Meteo** data (no API key required). Tauri 2 +
React + TypeScript, layered architecture (UI / service / data).

## Features

- Hero header with current temperature, condition, and today's H/L
- Condition + day/night aware animated gradient background with rain/snow particles
- Horizontally scrolling hourly forecast (24 h) with precipitation probability
- 10-day forecast with range bars between the global low/high
- Detail grid: UV, Sunrise/Sunset, Wind, Precipitation, Feels Like, Humidity, Visibility, Pressure
- Search & add multiple cities, switch between them, detect current location
- °C / °F toggle (auto-refreshes all cities)
- **Wayland-compatible out of the box** (see [Wayland support](#wayland-support))

## Architecture

```
src/         # ── FRONTEND (TypeScript / React) ──
  data/        # HTTP clients + types/normalization (no React)
  services/    # weather, location, units, gradient/scene
  store/       # zustand state
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

To swap in a paid provider, change the URL + uncomment the `API_KEY` header
in `src/data/openMeteoClient.ts`.

## Build & run

### Prerequisites (one-time)

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

# Rust (all)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Install + run

```bash
npm install
npm run tauri icon src/assets/weather-icon.svg   # optional, regenerates icons
npm run dev                                      # boots Vite + native window
```

### Build a distributable

```bash
npm run build
# Outputs (on Linux):
#   src-tauri/target/release/bundle/appimage/Weather_1.0.0_amd64.AppImage
#   src-tauri/target/release/bundle/deb/weather-app_1.0.0_amd64.deb
```

## Wayland support

Tauri uses **WebKitGTK** under the hood, which has known rendering issues on
Wayland (GNOME 45+, KDE 6+, Sway, Hyprland) caused by its default DMABUF
renderer. Symptoms include:

- A solid black or transparent app window
- Severe flickering or tearing
- Crash on launch with `BadAccess` / `GLX` errors in the journal
- Blurry text or laggy scrolling

### What this app does automatically

The Rust shell sets three environment variables at process start (in
`src-tauri/src/main.rs`), **before** the webview initializes:

| Variable | Value | Why |
|---|---|---|
| `WEBKIT_DISABLE_DMABUF_RENDERER` | `1` | Disables the broken DMABUF path on WebKitGTK 2.42+ |
| `WEBKIT_DISABLE_COMPOSITING_MODE` | `1` | Fallback for older WebKitGTK shipped on Ubuntu 22.04 / Debian stable |
| `__GL_GSYNC_ALLOWED` | `0` | Stops NVIDIA + Wayland frame-pacing stutter |

These are only applied if the user hasn't already set them, and the entire
fixup pass can be disabled by exporting `WEATHER_APP_NO_FIXUPS=1` before
launch.

If you also need to fall back from Wayland to XWayland on a specific machine:

```bash
GDK_BACKEND=x11 weather-app
```

### Launching the AppImage with the same env vars

The Rust binary's built-in fixups cover this case automatically, but
`scripts/run-weather.sh` is a portable launcher that exports the same
variables before exec'ing the binary — handy for testing or for distros
where AppImage execution strips environment vars.

```bash
./scripts/run-weather.sh ./Weather_1.0.0_amd64.AppImage
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

## Stretch ideas

- RainViewer radar tile card
- NWS / Met.no alert banners
- System tray / menu-bar widget
- Persisted city list via `tauri-plugin-store`
- Reduced-motion + high-contrast accessibility toggles

## License

MIT
