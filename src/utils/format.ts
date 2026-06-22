// Small presentation helpers (no business logic).

export function hourLabel(iso: string, index: number): string {
  if (index === 0) return "Now";
  const d = new Date(iso);
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h} ${ampm}`;
}

export function weekdayLabel(iso: string, index: number): string {
  if (index === 0) return "Today";
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function uvLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

export function pressureLabel(hpa: number): string {
  if (hpa < 1009) return "Low";
  if (hpa > 1022) return "High";
  return "Normal";
}

export function humidityNote(pct: number): string {
  if (pct >= 70) return "Humid";
  if (pct <= 30) return "Dry";
  return "Comfortable";
}

export function windDirToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}
