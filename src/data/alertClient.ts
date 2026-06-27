// ── DATA-ACCESS LAYER: NOAA NWS Weather Alerts Client ──

export interface RawAlertFeature {
  properties: {
    headline?: string;
    event?: string;
    severity?: string;
    description?: string;
    instruction?: string;
    effective?: string;
    expires?: string;
    parameters?: {
      NWSheadline?: string[];
    };
  };
  id?: string;
}

export interface RawAlertResponse {
  features?: RawAlertFeature[];
}

export async function fetchUSAlerts(lat: number, lon: number): Promise<RawAlertResponse> {
  // Only query US bounding box roughly to avoid unnecessary failures/delays for non-US points
  if (lat < 24 || lat > 49 || lon < -125 || lon > -66) {
    return { features: [] };
  }

  const url = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/geo+json",
      "User-Agent": "LinuxWeatherApp/1.1.0",
    },
  });
  if (!res.ok) {
    throw new Error(`Alert fetch failed (${res.status})`);
  }
  return (await res.json()) as RawAlertResponse;
}
