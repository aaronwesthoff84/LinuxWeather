// ── DATA-ACCESS LAYER: RainViewer radar tile manifest ──
// Free, no API key required. Docs: https://www.rainviewer.com/api.html
//
// The manifest returns a host + a list of frame paths. Tiles are then
// requested as `{host}{path}/{size}/{z}/{x}/{y}/{color}/{options}.png`.

const MANIFEST_URL =
  "https://api.rainviewer.com/public/weather-maps.json";

export interface RawRainViewerFrame {
  time: number; // unix seconds
  path: string;
}

export interface RawRainViewerManifest {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RawRainViewerFrame[];
    nowcast: RawRainViewerFrame[];
  };
  satellite?: {
    infrared: RawRainViewerFrame[];
  };
}

export async function fetchRadarManifest(): Promise<RawRainViewerManifest> {
  const res = await fetch(MANIFEST_URL, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`RainViewer manifest failed (${res.status})`);
  }
  return (await res.json()) as RawRainViewerManifest;
}
