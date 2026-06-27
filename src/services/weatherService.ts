// ── SERVICE LAYER: orchestrates data fetch + normalization ──

import { fetchForecast } from "../data/openMeteoClient";
import type {
  NormalizedWeather,
  RawForecastResponse,
  TemperatureUnit,
} from "../data/types";

function normalize(raw: RawForecastResponse): NormalizedWeather {
  const c = raw.current;

  const hourly = raw.hourly.time.map((time, i) => ({
    time,
    temperature: raw.hourly.temperature_2m[i],
    weatherCode: raw.hourly.weather_code[i],
    isDay: raw.hourly.is_day[i] === 1,
    precipProbability: raw.hourly.precipitation_probability[i] ?? 0,
    apparentTemperature: raw.hourly.apparent_temperature[i] ?? raw.hourly.temperature_2m[i],
    humidity: raw.hourly.relative_humidity_2m[i] ?? 0,
    windSpeed: raw.hourly.wind_speed_10m[i] ?? 0,
    windDirection: raw.hourly.wind_direction_10m[i] ?? 0,
  }));

  const daily = raw.daily.time.map((date, i) => ({
    date,
    weatherCode: raw.daily.weather_code[i],
    tempMax: raw.daily.temperature_2m_max[i],
    tempMin: raw.daily.temperature_2m_min[i],
    sunrise: raw.daily.sunrise[i],
    sunset: raw.daily.sunset[i],
    uvIndexMax: raw.daily.uv_index_max[i],
    precipProbabilityMax: raw.daily.precipitation_probability_max[i] ?? 0,
    windMax: raw.daily.wind_speed_10m_max[i],
  }));

  return {
    timezone: raw.timezone,
    current: {
      time: c.time,
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      isDay: c.is_day === 1,
      precipitation: c.precipitation,
      weatherCode: c.weather_code,
      windSpeed: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
      pressure: c.surface_pressure,
    },
    hourly,
    daily,
    todayHigh: daily[0]?.tempMax ?? c.temperature_2m,
    todayLow: daily[0]?.tempMin ?? c.temperature_2m,
  };
}

export function upcomingHours(
  weather: NormalizedWeather,
  count = 24
): NormalizedWeather["hourly"] {
  const now = Date.now();
  const startIdx = Math.max(
    0,
    weather.hourly.findIndex(
      (h) => new Date(h.time).getTime() >= now - 3600_000
    )
  );
  return weather.hourly.slice(startIdx, startIdx + count);
}

export async function getWeather(
  latitude: number,
  longitude: number,
  unit: TemperatureUnit,
  apiKey?: string
): Promise<NormalizedWeather> {
  const raw = await fetchForecast(latitude, longitude, unit, apiKey);
  return normalize(raw);
}
