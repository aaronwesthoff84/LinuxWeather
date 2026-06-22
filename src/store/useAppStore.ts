// ── Central client state with persistent storage (localStorage). ──
//
// Persists: cities, selectedId, settings, hasOnboarded.
// NOT persisted: weatherByCity (re-fetched on launch — data is time-sensitive).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { City, NormalizedWeather } from "../data/types";
import { DEFAULT_SETTINGS, type Settings } from "../services/settingsService";
import { getWeather } from "../services/weatherService";

interface WeatherEntry {
  status: "idle" | "loading" | "ready" | "error";
  data?: NormalizedWeather;
  error?: string;
}

interface AppState {
  cities: City[];
  selectedId: string | null;
  settings: Settings;
  hasOnboarded: boolean;
  weatherByCity: Record<string, WeatherEntry>;

  addCity: (city: City) => void;
  removeCity: (id: string) => void;
  selectCity: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  markOnboarded: () => void;
  loadWeather: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
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

      addCity: (city) => {
        const exists = get().cities.some((c) => c.id === city.id);
        if (!exists) {
          set((s) => ({ cities: [...s.cities, city] }));
        }
        set({ selectedId: city.id });
        void get().loadWeather(city.id);
      },

      removeCity: (id) =>
        set((s) => {
          const cities = s.cities.filter((c) => c.id !== id);
          const selectedId =
            s.selectedId === id ? cities[0]?.id ?? null : s.selectedId;
          const weatherByCity = { ...s.weatherByCity };
          delete weatherByCity[id];
          return { cities, selectedId, weatherByCity };
        }),

      selectCity: (id) => {
        set({ selectedId: id });
        const entry = get().weatherByCity[id];
        if (!entry || entry.status === "idle" || entry.status === "error") {
          void get().loadWeather(id);
        }
      },

      updateSettings: (patch) => {
        const prev = get().settings;
        const next = { ...prev, ...patch };
        set({ settings: next });
        // If the unit changed, refresh every city in the new unit.
        if (patch.unit && patch.unit !== prev.unit) {
          void get().refreshAll();
        }
        // If the API key changed, refresh as well.
        if (patch.apiKey !== undefined && patch.apiKey !== prev.apiKey) {
          void get().refreshAll();
        }
      },

      markOnboarded: () => set({ hasOnboarded: true }),

      loadWeather: async (id) => {
        const city = get().cities.find((c) => c.id === id);
        if (!city) return;
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
              [id]: { status: "ready", data },
            },
          }));
        } catch (e) {
          set((s) => ({
            weatherByCity: {
              ...s.weatherByCity,
              [id]: { status: "error", error: (e as Error).message },
            },
          }));
        }
      },

      refreshAll: async () => {
        await Promise.all(get().cities.map((c) => get().loadWeather(c.id)));
      },

      resetAll: () => {
        set({
          cities: [],
          selectedId: null,
          settings: DEFAULT_SETTINGS,
          hasOnboarded: false,
          weatherByCity: {},
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist the durable parts of the state. The cached weather data
      // is intentionally re-fetched on every launch so the user never sees
      // stale numbers from a previous session.
      partialize: (state) => ({
        cities: state.cities,
        selectedId: state.selectedId,
        settings: state.settings,
        hasOnboarded: state.hasOnboarded,
      }),
      version: 1,
    }
  )
);
