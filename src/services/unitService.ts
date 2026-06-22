// ── SERVICE LAYER: unit formatting (state itself lives in the store) ──

import type { TemperatureUnit } from "../data/types";

export function unitSymbol(unit: TemperatureUnit): string {
  return unit === "fahrenheit" ? "°F" : "°C";
}

export function windUnit(unit: TemperatureUnit): string {
  return unit === "fahrenheit" ? "mph" : "km/h";
}

export function degrees(value: number): string {
  return `${Math.round(value)}°`;
}
