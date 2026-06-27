// ── DATA-ACCESS LAYER: all HTTP calls live here ──
// Open-Meteo requires NO API key. To swap in a paid provider, change the
// BASE_URL + pass through the apiKey argument (now wired up to settings).

import type {
  RawForecastResponse,
  RawGeocodeResponse,
  TemperatureUnit,
} from "./types";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

async function getJson<T>(url: string, apiKey?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey && apiKey.trim().length > 0) {
    // Generic Bearer auth — matches the most common paid provider pattern.
    // Adjust the header name if your provider uses something different.
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }
  return (await res.json()) as T;
}

export async function fetchForecast(
  latitude: number,
  longitude: number,
  unit: TemperatureUnit,
  apiKey?: string
): Promise<RawForecastResponse> {
  const windUnit = unit === "fahrenheit" ? "mph" : "kmh";
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: "auto",
    temperature_unit: unit,
    wind_speed_unit: windUnit,
    forecast_days: "10",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "surface_pressure",
    ].join(","),
    hourly: [
      "temperature_2m",
      "weather_code",
      "is_day",
      "precipitation_probability",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_probability_max",
      "wind_speed_10m_max",
    ].join(","),
  });
  return getJson<RawForecastResponse>(
    `${FORECAST_URL}?${params.toString()}`,
    apiKey
  );
}

export async function searchPlaces(
  query: string
): Promise<RawGeocodeResponse> {
  const params = new URLSearchParams({
    name: query,
    count: "10",
    language: "en",
    format: "json",
  });
  return getJson<RawGeocodeResponse>(`${GEOCODE_URL}?${params.toString()}`);
}
