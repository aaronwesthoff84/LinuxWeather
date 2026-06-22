import type { NormalizedWeather, TemperatureUnit } from "../../data/types";
import { DetailCard } from "./DetailCard";
import { degrees, windUnit } from "../../services/unitService";
import {
  clockTime,
  humidityNote,
  pressureLabel,
  uvLabel,
  windDirToCompass,
} from "../../utils/format";

interface Props {
  weather: NormalizedWeather;
  unit: TemperatureUnit;
  surface: string;
}

export function DetailGrid({ weather, unit, surface }: Props) {
  const { current, daily } = weather;
  const today = daily[0];
  const uv = today?.uvIndexMax ?? 0;
  const foggy = current.weatherCode === 45 || current.weatherCode === 48;

  return (
    <section className="detail-grid fade-in">
      <DetailCard
        surface={surface}
        icon="☀️"
        caption="UV Index"
        value={Math.round(uv)}
        sub={uvLabel(uv)}
        severity={uv / 11}
      />
      <DetailCard
        surface={surface}
        icon="🌅"
        caption="Sunrise"
        value={today ? clockTime(today.sunrise) : "—"}
        sub={today ? `Sunset: ${clockTime(today.sunset)}` : undefined}
      />
      <DetailCard
        surface={surface}
        icon="💨"
        caption="Wind"
        value={`${Math.round(current.windSpeed)}`}
        sub={`${windUnit(unit)} · ${windDirToCompass(current.windDirection)}`}
      />
      <DetailCard
        surface={surface}
        icon="🌧️"
        caption="Precipitation"
        value={`${current.precipitation.toFixed(1)} mm`}
        sub={`${today?.precipProbabilityMax ?? 0}% chance today`}
      />
      <DetailCard
        surface={surface}
        icon="🌡️"
        caption="Feels Like"
        value={degrees(current.feelsLike)}
        sub={
          current.feelsLike < current.temperature
            ? "Wind makes it cooler"
            : "Humidity makes it warmer"
        }
      />
      <DetailCard
        surface={surface}
        icon="💧"
        caption="Humidity"
        value={`${Math.round(current.humidity)}%`}
        sub={humidityNote(current.humidity)}
      />
      <DetailCard
        surface={surface}
        icon="👁️"
        caption="Visibility"
        value={foggy ? "Poor" : "Clear"}
        sub={foggy ? "Fog reducing visibility" : "Good conditions"}
      />
      <DetailCard
        surface={surface}
        icon="📊"
        caption="Pressure"
        value={`${Math.round(current.pressure)}`}
        sub={`hPa · ${pressureLabel(current.pressure)}`}
        severity={(current.pressure - 980) / (1050 - 980)}
      />
    </section>
  );
}
