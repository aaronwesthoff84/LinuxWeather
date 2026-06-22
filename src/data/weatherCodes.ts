// WMO weather interpretation codes → label + emoji glyph.
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)

export interface WeatherDescriptor {
  label: string;
  dayGlyph: string;
  nightGlyph: string;
}

const MAP: Record<number, WeatherDescriptor> = {
  0: { label: "Clear", dayGlyph: "☀️", nightGlyph: "🌙" },
  1: { label: "Mostly Clear", dayGlyph: "🌤️", nightGlyph: "🌙" },
  2: { label: "Partly Cloudy", dayGlyph: "⛅", nightGlyph: "☁️" },
  3: { label: "Cloudy", dayGlyph: "☁️", nightGlyph: "☁️" },
  45: { label: "Fog", dayGlyph: "🌫️", nightGlyph: "🌫️" },
  48: { label: "Rime Fog", dayGlyph: "🌫️", nightGlyph: "🌫️" },
  51: { label: "Light Drizzle", dayGlyph: "🌦️", nightGlyph: "🌧️" },
  53: { label: "Drizzle", dayGlyph: "🌦️", nightGlyph: "🌧️" },
  55: { label: "Heavy Drizzle", dayGlyph: "🌧️", nightGlyph: "🌧️" },
  56: { label: "Freezing Drizzle", dayGlyph: "🌧️", nightGlyph: "🌧️" },
  57: { label: "Freezing Drizzle", dayGlyph: "🌧️", nightGlyph: "🌧️" },
  61: { label: "Light Rain", dayGlyph: "🌦️", nightGlyph: "🌧️" },
  63: { label: "Rain", dayGlyph: "🌧️", nightGlyph: "🌧️" },
  65: { label: "Heavy Rain", dayGlyph: "🌧️", nightGlyph: "🌧️" },
  66: { label: "Freezing Rain", dayGlyph: "🌧️", nightGlyph: "🌧️" },
  67: { label: "Freezing Rain", dayGlyph: "🌧️", nightGlyph: "🌧️" },
  71: { label: "Light Snow", dayGlyph: "🌨️", nightGlyph: "🌨️" },
  73: { label: "Snow", dayGlyph: "❄️", nightGlyph: "❄️" },
  75: { label: "Heavy Snow", dayGlyph: "❄️", nightGlyph: "❄️" },
  77: { label: "Snow Grains", dayGlyph: "🌨️", nightGlyph: "🌨️" },
  80: { label: "Rain Showers", dayGlyph: "🌦️", nightGlyph: "🌧️" },
  81: { label: "Rain Showers", dayGlyph: "🌧️", nightGlyph: "🌧️" },
  82: { label: "Heavy Showers", dayGlyph: "⛈️", nightGlyph: "⛈️" },
  85: { label: "Snow Showers", dayGlyph: "🌨️", nightGlyph: "🌨️" },
  86: { label: "Snow Showers", dayGlyph: "❄️", nightGlyph: "❄️" },
  95: { label: "Thunderstorm", dayGlyph: "⛈️", nightGlyph: "⛈️" },
  96: { label: "Thunderstorm", dayGlyph: "⛈️", nightGlyph: "⛈️" },
  99: { label: "Thunderstorm", dayGlyph: "⛈️", nightGlyph: "⛈️" },
};

const FALLBACK: WeatherDescriptor = {
  label: "—",
  dayGlyph: "🌡️",
  nightGlyph: "🌡️",
};

export function describeCode(code: number): WeatherDescriptor {
  return MAP[code] ?? FALLBACK;
}

export function glyphFor(code: number, isDay: boolean): string {
  const d = describeCode(code);
  return isDay ? d.dayGlyph : d.nightGlyph;
}

export function labelFor(code: number): string {
  return describeCode(code).label;
}

export type ConditionBucket =
  | "clear"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "thunder";

export function bucketFor(code: number): ConditionBucket {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ([95, 96, 99, 82].includes(code)) return "thunder";
  if ([71, 73, 75, 77, 85, 86, 56, 57, 66, 67].includes(code)) return "snow";
  if ([51, 53, 55, 61, 63, 65, 80, 81].includes(code)) return "rain";
  return "cloudy";
}
