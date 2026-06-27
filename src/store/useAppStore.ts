// ── Central client state with persistent storage (localStorage). ──

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { City, NormalizedWeather } from "../data/types";
import { DEFAULT_SETTINGS, type Settings } from "../services/settingsService";
import { getWeather } from "../services/weatherService";
import { getActiveAlerts, type WeatherAlert } from "../services/alertService";

export interface WeatherEntry {
  status: "idle" | "loading" | "ready" | "error";
  data?: NormalizedWeather;
  error?: string;
  lastUpdated?: number;
}

interface AppState {
  cities: City[];
  selectedId: string | null;
  settings: Settings;
  hasOnboarded: boolean;
  weatherByCity: Record<string, WeatherEntry>;
  alertsByCity: Record<string, WeatherAlert[]>;

  addCity: (city: City) => void;
  removeCity: (id: string) => void;
  selectCity: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  markOnboarded: () => void;
  loadWeather: (id: string, force?: boolean) => Promise<void>;
  loadAlerts: (id: string) => Promise<void>;
  refreshAll: (force?: boolean) => Promise<void>;
  resetAll: () => void;
}

const STORAGE_KEY = "linux-weather-state-v1";

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      cities: [],
      selectedId: null,
      settings: DEFAULT_SETTINGS,
      hasOnboarded: false,
      weatherByCity: {},
      alertsByCity: {},

      addCity: (city) => {
        const exists = get().cities.some((c) => c.id === city.id);
        if (!exists) {
          set((s) => ({ cities: [...s.cities, city] }));
        }
        set({ selectedId: city.id });
        void get().loadWeather(city.id, true);
      },

      removeCity: (id) =>
        set((s) => {
          const cities = s.cities.filter((c) => c.id !== id);
          const selectedId =
            s.selectedId === id ? cities[0]?.id ?? null : s.selectedId;
          const weatherByCity = { ...s.weatherByCity };
          delete weatherByCity[id];
          const alertsByCity = { ...s.alertsByCity };
          delete alertsByCity[id];
          return { cities, selectedId, weatherByCity, alertsByCity };
        }),

      selectCity: (id) => {
        set({ selectedId: id });
        const entry = get().weatherByCity[id];
        if (!entry || entry.status === "idle" || entry.status === "error") {
          void get().loadWeather(id);
        } else {
          void get().loadAlerts(id);
        }
      },

      updateSettings: (patch) => {
        const prev = get().settings;
        const next = { ...prev, ...patch };
        set({ settings: next });
        // If the unit changed, refresh every city in the new unit.
        if (patch.unit && patch.unit !== prev.unit) {
          void get().refreshAll(true);
        }
        // If the API key changed, refresh as well.
        if (patch.apiKey !== undefined && patch.apiKey !== prev.apiKey) {
          void get().refreshAll(true);
        }
        // If showAlerts changed to true, load alerts for selected city
        if (patch.showAlerts === true && get().selectedId) {
          void get().loadAlerts(get().selectedId!);
        }
      },

      markOnboarded: () => set({ hasOnboarded: true }),

      loadAlerts: async (id) => {
        const city = get().cities.find((c) => c.id === id);
        if (!city || !get().settings.showAlerts) return;
        try {
          const alerts = await getActiveAlerts(city.latitude, city.longitude);
          set((s) => ({
            alertsByCity: { ...s.alertsByCity, [id]: alerts },
          }));
        } catch (_) {
          // Silent fallback
        }
      },

      loadWeather: async (id, force = false) => {
        const city = get().cities.find((c) => c.id === id);
        if (!city) return;

        const currentEntry = get().weatherByCity[id];
        const now = Date.now();

        // If not forcing, and we have ready data fetched within the last 2 minutes, skip
        if (!force && currentEntry?.status === "ready" && currentEntry.lastUpdated && now - currentEntry.lastUpdated < 2 * 60 * 1000) {
          void get().loadAlerts(id);
          return;
        }

        if (typeof navigator !== "undefined" && !navigator.onLine && currentEntry?.data) {
          // Offline mode with cached data
          void get().loadAlerts(id);
          return;
        }

        set((s) => ({
          weatherByCity: {
            ...s.weatherByCity,
            [id]: { ...s.weatherByCity[id], status: "loading" },
          },
        }));

        try {
          const { unit, apiKey } = get().settings;
          const data = await getWeather(
            city.latitude,
            city.longitude,
            unit,
            apiKey || undefined
          );
          set((s) => ({
            weatherByCity: {
              ...s.weatherByCity,
              [id]: { status: "ready", data, lastUpdated: Date.now() },
            },
          }));
        } catch (e) {
          set((s) => ({
            weatherByCity: {
              ...s.weatherByCity,
              // Keep cached data if available
              [id]: {
                status: s.weatherByCity[id]?.data ? "ready" : "error",
                data: s.weatherByCity[id]?.data,
                lastUpdated: s.weatherByCity[id]?.lastUpdated,
                error: (e as Error).message,
              },
            },
          }));
        }

        void get().loadAlerts(id);
      },

      refreshAll: async (force = false) => {
        await Promise.all(get().cities.map((c) => get().loadWeather(c.id, force)));
      },

      resetAll: () => {
        set({
          cities: [],
          selectedId: null,
          settings: DEFAULT_SETTINGS,
          hasOnboarded: false,
          weatherByCity: {},
          alertsByCity: {},
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Persist weatherByCity for offline cache support as requested in Issue #6
      partialize: (state) => ({
        cities: state.cities,
        selectedId: state.selectedId,
        settings: state.settings,
        hasOnboarded: state.hasOnboarded,
        weatherByCity: state.weatherByCity,
      }),
      version: 1,
    }
  )
);
