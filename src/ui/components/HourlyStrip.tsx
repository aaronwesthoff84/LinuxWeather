import type { NormalizedWeather } from "../../data/types";
import { glyphFor } from "../../data/weatherCodes";
import { upcomingHours } from "../../services/weatherService";
import { degrees } from "../../services/unitService";
import { hourLabel } from "../../utils/format";

interface Props {
  weather: NormalizedWeather;
  surface: string;
}

export function HourlyStrip({ weather, surface }: Props) {
  const hours = upcomingHours(weather, 24);
  return (
    <section className="card hourly fade-in" style={{ background: surface }}>
      <div className="card-caption">⏱ Hourly Forecast</div>
      <div className="hourly-track">
        {hours.map((h, i) => (
          <div className="hour-cell" key={h.time}>
            <span className="h-label">{hourLabel(h.time, i)}</span>
            <span className="h-glyph">{glyphFor(h.weatherCode, h.isDay)}</span>
            <span className="h-temp">{degrees(h.temperature)}</span>
            {h.precipProbability >= 20 && (
              <span className="h-pop">{h.precipProbability}%</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
