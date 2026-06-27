// ── SERVICE LAYER: Alert normalization ──

import { fetchUSAlerts } from "../data/alertClient";

export type AlertSeverity = "Extreme" | "Severe" | "Moderate" | "Minor";

export interface WeatherAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  description: string;
  effective: number; // unix ms
  expires: number; // unix ms
  url?: string;
  regions: string[];
}

function parseSeverity(s?: string): AlertSeverity {
  if (!s) return "Minor";
  const lower = s.toLowerCase();
  if (lower === "extreme") return "Extreme";
  if (lower === "severe") return "Severe";
  if (lower === "moderate") return "Moderate";
  return "Minor";
}

export async function getActiveAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  try {
    const raw = await fetchUSAlerts(lat, lon);
    if (!raw.features || raw.features.length === 0) {
      return [];
    }

    const now = Date.now();
    const alerts: WeatherAlert[] = [];

    for (const f of raw.features) {
      const props = f.properties;
      if (!props) continue;

      const expiresMs = props.expires ? new Date(props.expires).getTime() : now + 3600000;
      if (expiresMs < now) {
        continue; // skip expired
      }

      const effectiveMs = props.effective ? new Date(props.effective).getTime() : now;
      const severity = parseSeverity(props.severity);
      const title = props.event || props.headline || "Weather Alert";
      const description = props.description || props.instruction || title;
      const url = f.id || `https://weather.gov`;

      alerts.push({
        id: f.id || `${title}-${expiresMs}`,
        title,
        severity,
        description,
        effective: effectiveMs,
        expires: expiresMs,
        url,
        regions: [],
      });
    }

    return alerts;
  } catch (e) {
    // Graceful fallback: silently return empty array if alert source fails
    return [];
  }
}
