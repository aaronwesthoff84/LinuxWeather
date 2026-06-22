// ── SERVICE LAYER: radar frame normalization + tile URL templating ──

import { fetchRadarManifest } from "../data/rainViewerClient";

/** A single radar frame ready to be added to a Leaflet TileLayer. */
export interface RadarFrame {
  /** Unix milliseconds for display (Date label, etc.). */
  timestamp: number;
  /** Whether this frame is a forecast (nowcast) rather than observed past. */
  forecast: boolean;
  /** Templated URL with `{z}/{x}/{y}` placeholders for Leaflet. */
  tileUrlTemplate: string;
}

export interface RadarBundle {
  /** Combined past + nowcast frames, sorted oldest → newest. */
  frames: RadarFrame[];
  /** Index of the most recent observed (non-forecast) frame, for default playback. */
  defaultIndex: number;
}

/** Tile rendering options understood by RainViewer's tile server. */
export interface RadarOptions {
  /** Tile pixel size — 256 (lighter) or 512 (sharper on HiDPI). */
  size?: 256 | 512;
  /** Color scheme 0..8; see RainViewer docs. 2 = "Universal Blue", 7 = "Rainbow Selex". */
  color?: number;
  /** Show smooth (interpolated) tiles. */
  smooth?: boolean;
  /** Render snow separately in light blue. */
  snow?: boolean;
}

const DEFAULTS: Required<RadarOptions> = {
  size: 256,
  color: 2,
  smooth: true,
  snow: true,
};

/** Fetch + normalize the latest RainViewer radar bundle. */
export async function getRadarBundle(
  options: RadarOptions = {}
): Promise<RadarBundle> {
  const o = { ...DEFAULTS, ...options };
  const manifest = await fetchRadarManifest();

  const build = (path: string): string =>
    `${manifest.host}${path}/${o.size}/{z}/{x}/{y}/${o.color}/${
      o.smooth ? 1 : 0
    }_${o.snow ? 1 : 0}.png`;

  const past = manifest.radar.past.map((f) => ({
    timestamp: f.time * 1000,
    forecast: false,
    tileUrlTemplate: build(f.path),
  }));
  const nowcast = manifest.radar.nowcast.map((f) => ({
    timestamp: f.time * 1000,
    forecast: true,
    tileUrlTemplate: build(f.path),
  }));

  const frames = [...past, ...nowcast].sort(
    (a, b) => a.timestamp - b.timestamp
  );
  const defaultIndex = Math.max(0, past.length - 1);

  return { frames, defaultIndex };
}
