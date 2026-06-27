// ── DATA-ACCESS LAYER: raw API shapes + normalized domain model ──

/** Raw Open-Meteo geocoding result. */
export interface RawGeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
}

export interface RawGeocodeResponse {
  results?: RawGeocodeResult[];
}

/** Raw Open-Meteo forecast response (only fields we request). */
export interface RawForecastResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: 0 | 1;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    surface_pressure: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    is_day: (0 | 1)[];
    precipitation_probability: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
}

/** A place the user can track. */
export interface City {
  id: string;
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  isCurrent?: boolean;
}

export interface CurrentConditions {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  isDay: boolean;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  precipProbability: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
}

export interface DailyPoint {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
  precipProbabilityMax: number;
  windMax: number;
}

/** Fully normalized payload consumed by the UI layer. */
export interface NormalizedWeather {
  timezone: string;
  current: CurrentConditions;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  todayHigh: number;
  todayLow: number;
}

export type TemperatureUnit = "celsius" | "fahrenheit";
