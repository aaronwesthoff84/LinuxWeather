// ── SERVICE LAYER: city search / add / detect ──

import { searchPlaces } from "../data/openMeteoClient";
import { detectLocation } from "../data/geolocationClient";
import { getWeather } from "./weatherService";
import type { City } from "../data/types";

export async function searchCities(query: string): Promise<City[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const res = await searchPlaces(trimmed);
  return (res.results ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    region: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

/** Detect the device's location and build a City entry. */
export async function detectCurrentCity(): Promise<City> {
  const loc = await detectLocation();
  let name = loc.name;

  if (!name) {
    try {
      const w = await getWeather(loc.latitude, loc.longitude, "celsius");
      name = w.timezone.split("/").pop()?.replace(/_/g, " ");
    } catch {
      name = "Current Location";
    }
  }

  return {
    id: "current-location",
    name: name ?? "Current Location",
    country: loc.country,
    latitude: loc.latitude,
    longitude: loc.longitude,
    isCurrent: true,
  };
}
