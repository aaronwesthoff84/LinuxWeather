import { useRef, useState, useEffect } from "react";
import type { NormalizedWeather } from "../../data/types";
import { glyphFor, labelFor } from "../../data/weatherCodes";
import { upcomingHours } from "../../services/weatherService";
import { degrees, windUnit } from "../../services/unitService";
import { hourLabel, windDirToCompass } from "../../utils/format";
import { useAppStore } from "../../store/useAppStore";

interface Props {
  weather: NormalizedWeather;
  surface: string;
}

export function HourlyStrip({ weather, surface }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const hours = upcomingHours(weather, 24);
  const settings = useAppStore((s) => s.settings);

  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [selectedHour, setSelectedHour] = useState<typeof hours[0] | null>(null);

  const checkScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setIsAtStart(track.scrollLeft <= 10);
    setIsAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 10);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    checkScroll();
    track.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      track.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [hours]);

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
    <>
      <section className="card hourly fade-in" style={{ background: surface }}>
        <div className="card-caption">⏱ Hourly Forecast</div>
        <div className="hourly-wrap">
          {!isAtStart && (
            <button
              className="scroll-arrow-btn left"
              onClick={() => scroll("left")}
              aria-label="Scroll left"
            >
              ‹
            </button>
          )}
          <div className="hourly-track" ref={trackRef}>
            {hours.map((h, i) => (
              <div
                className="hour-cell"
                key={h.time}
                onClick={() => setSelectedHour(h)}
                style={{ cursor: "pointer" }}
              >
                <span className="h-label">{hourLabel(h.time, i)}</span>
                <span className="h-glyph">{glyphFor(h.weatherCode, h.isDay)}</span>
                <span className="h-temp">{degrees(h.temperature)}</span>
                {h.precipProbability >= 20 && (
                  <span className="h-pop">{h.precipProbability}%</span>
                )}
              </div>
            ))}
          </div>
          {!isAtEnd && (
            <button
              className="scroll-arrow-btn right"
              onClick={() => scroll("right")}
              aria-label="Scroll right"
            >
              ›
            </button>
          )}
        </div>
      </section>

      {/* Hour Detail Bottom Sheet Popup */}
      {selectedHour && (
        <div className="sheet-overlay" onClick={() => setSelectedHour(null)}>
          <div className="sheet fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="hour-detail-content">
              <div className="hour-detail-top">
                <div className="hour-detail-time">
                  {new Date(selectedHour.time).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                  {" · "}
                  {new Date(selectedHour.time).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
                <div className="hour-detail-temp-wrap">
                  <span className="hour-detail-glyph">
                    {glyphFor(selectedHour.weatherCode, selectedHour.isDay)}
                  </span>
                  <span className="hour-detail-temp">{degrees(selectedHour.temperature)}</span>
                </div>
                <div className="hour-detail-cond">{labelFor(selectedHour.weatherCode)}</div>
              </div>

              <div className="hour-detail-grid">
                <div className="hour-detail-item">
                  <span className="hour-detail-item-label">Feels Like</span>
                  <span className="hour-detail-item-val">{degrees(selectedHour.apparentTemperature)}</span>
                </div>
                <div className="hour-detail-item">
                  <span className="hour-detail-item-label">Precipitation</span>
                  <span className="hour-detail-item-val">{selectedHour.precipProbability}%</span>
                </div>
                <div className="hour-detail-item">
                  <span className="hour-detail-item-label">Humidity</span>
                  <span className="hour-detail-item-val">{selectedHour.humidity}%</span>
                </div>
                <div className="hour-detail-item">
                  <span className="hour-detail-item-label">Wind</span>
                  <span className="hour-detail-item-val">
                    {Math.round(selectedHour.windSpeed)} {windUnit(settings.unit)} {windDirToCompass(selectedHour.windDirection)}
                  </span>
                </div>
              </div>
            </div>
            <button className="close" onClick={() => setSelectedHour(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
