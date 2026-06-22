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

## Architecture

```
src/
  data/        # HTTP clients + types/normalization (no React)
  services/    # weather, location, units, gradient/scene
  store/       # zustand state
  utils/       # formatting helpers
  ui/          # components + design tokens
src-tauri/     # Rust shell (Tauri 2)
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
npm run tauri icon assets/icon-source.png   # optional, needs a 1024px PNG
npm run dev                                 # boots Vite + native window
```

### Build a distributable

```bash
npm run build
# Outputs (on Linux):
#   src-tauri/target/release/bundle/appimage/Weather_1.0.0_amd64.AppImage
#   src-tauri/target/release/bundle/deb/weather-app_1.0.0_amd64.deb
```

## Stretch ideas

- RainViewer radar tile card
- NWS / Met.no alert banners
- System tray / menu-bar widget
- Persisted city list via `tauri-plugin-store`
- Reduced-motion + high-contrast accessibility toggles

## License

MIT
