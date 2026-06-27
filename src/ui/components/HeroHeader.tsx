import type { City, NormalizedWeather } from "../../data/types";
import { labelFor } from "../../data/weatherCodes";
import { degrees } from "../../services/unitService";

interface Props {
  city: City;
  weather: NormalizedWeather;
  lastUpdated?: number;
}

export function HeroHeader({ city, weather, lastUpdated }: Props) {
  const { current, todayHigh, todayLow } = weather;

  const getUpdatedText = () => {
    if (!lastUpdated) return "";
    const diffMs = Date.now() - lastUpdated;
    const diffMin = Math.round(diffMs / 60000);
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    if (isOffline) {
      const hours = Math.round(diffMin / 60);
      return `Offline · Last updated ${hours > 0 ? `${hours} hours` : `${diffMin} min`} ago`;
    }

    if (diffMin <= 1) return "Updated just now";
    if (diffMin < 60) return `Updated ${diffMin} min ago`;
    const hours = Math.round(diffMin / 60);
    return `Updated ${hours} hours ago`;
  };

  const updatedText = getUpdatedText();

  return (
    <header className="hero fade-in">
      <div className="city">{city.name}</div>
      <div className="temp">{degrees(current.temperature)}</div>
      <div className="summary">{labelFor(current.weatherCode)}</div>
      <div className="hilo">
        H:{degrees(todayHigh)} &nbsp; L:{degrees(todayLow)}
      </div>
      {updatedText && (
        <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "8px", fontWeight: 500 }}>
          {updatedText}
        </div>
      )}
    </header>
  );
}
