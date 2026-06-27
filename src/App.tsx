import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "./store/useAppStore";
import { detectCurrentCity } from "./services/locationService";
import { sceneFor } from "./services/gradientService";
import { degrees } from "./services/unitService";
import { labelFor } from "./data/weatherCodes";
import { HeroHeader } from "./ui/components/HeroHeader";
import { HourlyStrip } from "./ui/components/HourlyStrip";
import { DailyForecast } from "./ui/components/DailyForecast";
import { DetailGrid } from "./ui/components/DetailGrid";
import { CitySearch } from "./ui/components/CitySearch";
import { CityTabs } from "./ui/components/CityTabs";
import { RadarMap } from "./ui/components/RadarMap";
import { SettingsSheet } from "./ui/components/SettingsSheet";
import { AnimatedBackground } from "./ui/components/AnimatedBackground";
import { AlertBanner } from "./ui/components/AlertBanner";
import { TrayPopup } from "./ui/components/TrayPopup";

// Declare global properties on window for Tauri tray callbacks
declare global {
  interface Window {
    __TRAY_REFRESH?: () => void;
    __TRAY_SETTINGS?: () => void;
    __TRAY_TOGGLE_POPUP?: () => void;
  }
}

export default function App() {
  const cities = useAppStore((s) => s.cities);
  const selectedId = useAppStore((s) => s.selectedId);
  const settings = useAppStore((s) => s.settings);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const weatherByCity = useAppStore((s) => s.weatherByCity);
  const loadWeather = useAppStore((s) => s.loadWeather);
  const refreshAll = useAppStore((s) => s.refreshAll);
  const addCity = useAppStore((s) => s.addCity);
  const markOnboarded = useAppStore((s) => s.markOnboarded);

  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [trayPopupOpen, setTrayPopupOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [onboardingMessage, setOnboardingMessage] = useState<string | null>(null);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const onboardingRan = useRef(false);

  const selectedCity = cities.find((c) => c.id === selectedId) ?? null;
  const entry = selectedId ? weatherByCity[selectedId] : undefined;

  useEffect(() => {
    const handleResize = () => setIsWideScreen(window.innerWidth >= 1100);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Setup Tauri Tray global callbacks
  useEffect(() => {
    window.__TRAY_REFRESH = () => {
      void refreshAll(true);
    };
    window.__TRAY_SETTINGS = () => {
      setSettingsOpen(true);
    };
    window.__TRAY_TOGGLE_POPUP = () => {
      setTrayPopupOpen((prev) => !prev);
    };
    return () => {
      delete window.__TRAY_REFRESH;
      delete window.__TRAY_SETTINGS;
      delete window.__TRAY_TOGGLE_POPUP;
    };
  }, [refreshAll]);

  // Update Tray tooltip dynamically when weather changes
  useEffect(() => {
    if (settings.showTray !== false && entry?.status === "ready" && entry.data) {
      try {
        const tempStr = degrees(entry.data.current.temperature);
        const condition = labelFor(entry.data.current.weatherCode);
        void invoke("update_tray_weather", { tempStr, condition }).catch(() => {});
      } catch (_) {
        // Not running in Tauri context, ignore
      }
    }
  }, [entry?.status, entry?.data, settings.showTray]);

  useEffect(() => {
    if (onboardingRan.current) return;
    onboardingRan.current = true;
    if (hasOnboarded || cities.length > 0) return;
    if (!settings.autoDetectOnFirstLaunch) {
      markOnboarded();
      return;
    }
    setDetecting(true);
    (async () => {
      try {
        const city = await detectCurrentCity();
        addCity(city);
      } catch (e) {
        setOnboardingMessage("Couldn't detect your location automatically. Tap ＋ Add to choose a city.");
      } finally {
        setDetecting(false);
        markOnboarded();
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedId && !weatherByCity[selectedId]) {
      void loadWeather(selectedId);
    }
  }, [selectedId, weatherByCity, loadWeather]);

  useEffect(() => {
    if (settings.autoRefreshMinutes <= 0) return;
    const id = window.setInterval(() => void refreshAll(), settings.autoRefreshMinutes * 60 * 1000);
    return () => window.clearInterval(id);
  }, [settings.autoRefreshMinutes, refreshAll]);

  useEffect(() => {
    document.body.classList.toggle("reduced-motion", settings.reducedMotion);
  }, [settings.reducedMotion]);

  const handleDetect = async () => {
    setDetecting(true);
    setOnboardingMessage(null);
    try {
      const city = await detectCurrentCity();
      addCity(city);
    } catch (e) {
      alert("Could not detect location: " + (e as Error).message);
    } finally {
      setDetecting(false);
    }
  };

  const scene = entry?.data ? sceneFor(entry.data.current.weatherCode, entry.data.current.isDay) : null;
  const surface = scene?.surface ?? "rgba(255,255,255,0.12)";

  return (
    <div className="app">
      {scene && <AnimatedBackground scene={scene} reducedMotion={settings.reducedMotion} />}
      <div className="app-shell">
        <div className="topbar">
          <button onClick={handleDetect} disabled={detecting}>{detecting ? "Locating…" : "📍"}</button>
          <button onClick={() => setSettingsOpen(true)} aria-label="Settings">⚙</button>
          <button onClick={() => setSearchOpen(true)}>＋</button>
        </div>
        <CityTabs />
        <div className="scroll-area">
          {!selectedCity && detecting && <div className="status">Detecting your location…</div>}
          {!selectedCity && !detecting && <div className="status">{onboardingMessage ?? "Add a city to begin."}</div>}
          {selectedCity && entry?.status === "loading" && <div className="status">Loading {selectedCity.name}…</div>}
          {selectedCity && entry?.status === "error" && (
            <div className="status">Couldn't load weather.<br />
              <button className="city-dot" style={{width:"auto",height:"auto",padding:"8px 14px",marginTop:12}} onClick={() => loadWeather(selectedCity.id, true)}>Retry</button>
            </div>
          )}
          {selectedCity && entry?.status === "ready" && entry.data && (
            <>
              <AlertBanner />
              <HeroHeader city={selectedCity} weather={entry.data} lastUpdated={entry.lastUpdated} />
              {isWideScreen ? (
                <div className="forecast-grid">
                  <div className="forecast-col">
                    <HourlyStrip weather={entry.data} surface={surface} />
                    <DailyForecast weather={entry.data} surface={surface} />
                  </div>
                  <div className="forecast-col">
                    {settings.showRadar && <RadarMap city={selectedCity} surface={surface} />}
                    <DetailGrid weather={entry.data} unit={settings.unit} surface={surface} />
                  </div>
                </div>
              ) : (
                <div className="forecast-col">
                  <HourlyStrip weather={entry.data} surface={surface} />
                  {settings.showRadar && <RadarMap city={selectedCity} surface={surface} />}
                  <DailyForecast weather={entry.data} surface={surface} />
                  <DetailGrid weather={entry.data} unit={settings.unit} surface={surface} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {searchOpen && <CitySearch onClose={() => setSearchOpen(false)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      {trayPopupOpen && <TrayPopup onClose={() => setTrayPopupOpen(false)} />}
    </div>
  );
}
