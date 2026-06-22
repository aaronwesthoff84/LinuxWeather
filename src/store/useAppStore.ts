// Central client state (cities, selection, units, fetched weather, status).

import { create } from "zustand";
import type { City, NormalizedWeather, TemperatureUnit } from "../data/types";
import { getWeather } from "../services/weatherService";

interface WeatherEntry {
  status: "idle" | "loading" | "ready" | "error";
  data?: NormalizedWeather;
  error?: string;
}

interface AppState {
  cities: City[];
  selectedId: string | null;
  unit: TemperatureUnit;
  weatherByCity: Record<string, WeatherEntry>;

  addCity: (city: City) => void;
  removeCity: (id: string) => void;
  selectCity: (id: string) => void;
  toggleUnit: () => void;
  loadWeather: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const SEED: City[] = [
  {
    id: "seed-cupertino",
    name: "Cupertino",
    region: "California",
    country: "United States",
    latitude: 37.323,
    longitude: -122.0322,
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  cities: SEED,
  selectedId: SEED[0].id,
  unit: "fahrenheit",
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

  toggleUnit: () => {
    set((s) => ({ unit: s.unit === "celsius" ? "fahrenheit" : "celsius" }));
    void get().refreshAll();
  },

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
      const data = await getWeather(city.latitude, city.longitude, get().unit);
      set((s) => ({
        weatherByCity: { ...s.weatherByCity, [id]: { status: "ready", data } },
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
}));
