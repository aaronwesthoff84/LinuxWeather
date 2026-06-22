import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "./store/useAppStore";
import { detectCurrentCity } from "./services/locationService";
import { sceneFor } from "./services/gradientService";
import { unitSymbol } from "./services/unitService";
import { AnimatedBackground } from "./ui/components/AnimatedBackground";
import { HeroHeader } from "./ui/components/HeroHeader";
import { HourlyStrip } from "./ui/components/HourlyStrip";
import { DailyForecast } from "./ui/components/DailyForecast";
import { DetailGrid } from "./ui/components/DetailGrid";
import { CitySearch } from "./ui/components/CitySearch";
import { CityTabs } from "./ui/components/CityTabs";

export default function App() {
  const cities = useAppStore((s) => s.cities);
  const selectedId = useAppStore((s) => s.selectedId);
  const unit = useAppStore((s) => s.unit);
  const weatherByCity = useAppStore((s) => s.weatherByCity);
  const loadWeather = useAppStore((s) => s.loadWeather);
  const toggleUnit = useAppStore((s) => s.toggleUnit);
  const addCity = useAppStore((s) => s.addCity);

  const [searchOpen, setSearchOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const selectedCity = cities.find((c) => c.id === selectedId) ?? null;
  const entry = selectedId ? weatherByCity[selectedId] : undefined;

  useEffect(() => {
    if (selectedId && !weatherByCity[selectedId]) {
      void loadWeather(selectedId);
    }
  }, [selectedId, weatherByCity, loadWeather]);

  const scene = useMemo(() => {
    if (entry?.status === "ready" && entry.data) {
      return sceneFor(entry.data.current.weatherCode, entry.data.current.isDay);
    }
    return sceneFor(0, true);
  }, [entry]);

  const handleDetect = async () => {
    setDetecting(true);
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
    <div className="app">
      <AnimatedBackground scene={scene} />

      <div className="topbar">
        <button onClick={handleDetect} disabled={detecting}>
          {detecting ? "Locating…" : "📍 Locate"}
        </button>
        <button onClick={toggleUnit}>{unitSymbol(unit)}</button>
        <button onClick={() => setSearchOpen(true)}>＋ Add</button>
      </div>

      <div className="scroll-area">
        <CityTabs />

        {!selectedCity && <div className="status">Add a city to begin.</div>}

        {selectedCity && entry?.status === "loading" && (
          <div className="status">Loading {selectedCity.name}…</div>
        )}

        {selectedCity && entry?.status === "error" && (
          <div className="status">
            Couldn’t load weather.
            <br />
            <button
              className="city-dot"
              style={{
                width: "auto",
                height: "auto",
                padding: "8px 14px",
                marginTop: 12,
              }}
              onClick={() => loadWeather(selectedCity.id)}
            >
              Retry
            </button>
          </div>
        )}

        {selectedCity && entry?.status === "ready" && entry.data && (
          <>
            <HeroHeader city={selectedCity} weather={entry.data} />
            <HourlyStrip weather={entry.data} surface={scene.surface} />
            <DailyForecast weather={entry.data} surface={scene.surface} />
            <DetailGrid
              weather={entry.data}
              unit={unit}
              surface={scene.surface}
            />
          </>
        )}
      </div>

      {searchOpen && <CitySearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
