// ── SERVICE LAYER: app settings defaults + helpers ──

import type { TemperatureUnit } from "../data/types";

export interface Settings {
  /** Temperature display unit. */
  unit: TemperatureUnit;
  /** Disable animated gradient + rain/snow particles + fade-ins. */
  reducedMotion: boolean;
  /** Show or hide the precipitation radar card. */
  showRadar: boolean;
  /** Background auto-refresh interval. 0 = off. */
  autoRefreshMinutes: number;
  /**
   * Optional API key. Open-Meteo doesn't require one; this is here so users
   * who swap in a paid provider (in `src/data/openMeteoClient.ts`) can
   * configure their key from the UI instead of editing source.
   */
  apiKey: string;
  /** Try to detect the user's location on first launch. */
  autoDetectOnFirstLaunch: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  unit: "fahrenheit",
  reducedMotion: false,
  showRadar: true,
  autoRefreshMinutes: 15,
  apiKey: "",
  autoDetectOnFirstLaunch: true,
};

export interface RefreshOption {
  value: number;
  label: string;
}

export const REFRESH_OPTIONS: RefreshOption[] = [
  { value: 0, label: "Off" },
  { value: 5, label: "Every 5 min" },
  { value: 15, label: "Every 15 min" },
  { value: 30, label: "Every 30 min" },
  { value: 60, label: "Every hour" },
];

export const APP_VERSION = "1.1.0";
