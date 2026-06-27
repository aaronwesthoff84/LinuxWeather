import { useRef } from "react";
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
  const trackRef = useRef<HTMLDivElement | null>(null);
  const hours = upcomingHours(weather, 24);

  const scroll = (dir: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const amount = track.clientWidth * 0.8;
    track.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="card hourly fade-in" style={{ background: surface }}>
      <div className="card-caption">⏱ Hourly Forecast</div>
      <div className="hourly-track" ref={trackRef}>
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
      <div className="hourly-arrows">
        <button className="hourly-arrow" onClick={() => scroll("left")} aria-label="Scroll hourly left">‹</button>
        <button className="hourly-arrow" onClick={() => scroll("right")} aria-label="Scroll hourly right">›</button>
      </div>
    </section>
  );
}
