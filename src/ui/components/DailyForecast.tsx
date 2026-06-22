import type { NormalizedWeather } from "../../data/types";
import { glyphFor } from "../../data/weatherCodes";
import { degrees } from "../../services/unitService";
import { weekdayLabel } from "../../utils/format";

interface Props {
  weather: NormalizedWeather;
  surface: string;
}

export function DailyForecast({ weather, surface }: Props) {
  const days = weather.daily.slice(0, 10);
  const globalMin = Math.min(...days.map((d) => d.tempMin));
  const globalMax = Math.max(...days.map((d) => d.tempMax));
  const span = Math.max(1, globalMax - globalMin);

  return (
    <section className="card daily fade-in" style={{ background: surface }}>
      <div className="card-caption">📅 10-Day Forecast</div>
      {days.map((d, i) => {
        const left = ((d.tempMin - globalMin) / span) * 100;
        const width = ((d.tempMax - d.tempMin) / span) * 100;
        return (
          <div className="day-row" key={d.date}>
            <span className="d-name">{weekdayLabel(d.date, i)}</span>
            <span className="d-glyph">{glyphFor(d.weatherCode, true)}</span>
            <span className="d-low">{degrees(d.tempMin)}</span>
            <div className="range-track">
              <div
                className="range-fill"
                style={{ left: `${left}%`, width: `${Math.max(width, 6)}%` }}
              />
            </div>
            <span className="d-high">{degrees(d.tempMax)}</span>
          </div>
        );
      })}
    </section>
  );
}
