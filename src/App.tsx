import { useEffect, useMemo, useState, useRef } from "react";
import { useAppStore } from "./store/useAppStore";
import { detectCurrentCity } from "./services/locationService";
import { sceneFor } from "./services/gradientService";
import { HeroHeader } from "./ui/components/HeroHeader";
import { HourlyStrip } from "./ui/components/HourlyStrip";
import { DailyForecast } from "./ui/components/DailyForecast";
import { DetailGrid } from "./ui/components/DetailGrid";
import { CitySearch } from "./ui/components/CitySearch";
import { CityTabs } from "./ui/components/CityTabs";
import { RadarMap } from "./ui/components/RadarMap";
import { SettingsSheet } from "./ui/components/SettingsSheet";

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
  const [detecting, setDetecting] = useState(false);
  const [onboardingMessage, setOnboardingMessage] = useState<string | null>(null);
  const onboardingRan = useRef(false);

  const selectedCity = cities.find((c) => c.id === selectedId) ?? null;
  const entry = selectedId ? weatherByCity[selectedId] : undefined;

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

  const scene = useMemo(() => {
    if (entry?.status === "ready" && entry.data) {
      return sceneFor(entry.data.current.weatherCode, entry.data.current.isDay);
    }
    return sceneFor(0, true);
  }, [entry]);

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

  return (
    <div className="app" style={{ background: '#1a1a2e' }}>
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
              <button className="city-dot" style={{width:"auto",height:"auto",padding:"8px 14px",marginTop:12}} onClick={() => loadWeather(selectedCity.id)}>Retry</button>
            </div>
          )}
          {selectedCity && entry?.status === "ready" && entry.data && (
            <>
              <HeroHeader city={selectedCity} weather={entry.data} />
              <HourlyStrip weather={entry.data} surface={scene.surface} />
              {settings.showRadar && <RadarMap city={selectedCity} surface={scene.surface} />}
              <DailyForecast weather={entry.data} surface={scene.surface} />
              <DetailGrid weather={entry.data} unit={settings.unit} surface={scene.surface} />
            </>
          )}
        </div>
      </div>
      {searchOpen && <CitySearch onClose={() => setSearchOpen(false)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
