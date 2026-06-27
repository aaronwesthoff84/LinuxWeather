// ── UI LAYER: animated precipitation radar tile map (RainViewer + Leaflet) ──

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { City } from "../../data/types";
import { getRadarBundle, type RadarFrame } from "../../services/radarService";

interface Props {
  city: City;
  surface: string;
}

const FRAME_INTERVAL_MS = 500;
const ACTIVE_OPACITY = 0.7;

export function RadarMap({ city, surface }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.TileLayer[]>([]);
  const tickRef = useRef<number | null>(null);

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inline map
  useEffect(() => {
    if (!containerRef.current || isFullscreen) return;
    const map = L.map(containerRef.current, {
      center: [city.latitude, city.longitude],
      zoom: 7,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> · Radar © <a href="https://rainviewer.com">RainViewer</a>',
      maxZoom: 11, minZoom: 3, className: "osm-base",
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    L.circleMarker([city.latitude, city.longitude], {
      radius: 6, color: "#fff", fillColor: "#ffd65a", fillOpacity: 1, weight: 2,
    }).addTo(map).bindTooltip(city.name, { permanent: false, direction: "top" });

    return () => { map.remove(); mapRef.current = null; layersRef.current = []; };
  }, [city.id, city.latitude, city.longitude, city.name, isFullscreen]);

  // Fullscreen map
  const fsContainerRef = useRef<HTMLDivElement | null>(null);
  const fsMapRef = useRef<L.Map | null>(null);
  const fsLayersRef = useRef<L.TileLayer[]>([]);

  useEffect(() => {
    if (!isFullscreen || !fsContainerRef.current) return;
    const map = L.map(fsContainerRef.current, {
      center: [city.latitude, city.longitude],
      zoom: 7, zoomControl: false, attributionControl: true, preferCanvas: true,
    });
    fsMapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> · Radar © <a href="https://rainviewer.com">RainViewer</a>',
      maxZoom: 11, minZoom: 3, className: "osm-base",
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    L.circleMarker([city.latitude, city.longitude], {
      radius: 6, color: "#fff", fillColor: "#ffd65a", fillOpacity: 1, weight: 2,
    }).addTo(map).bindTooltip(city.name, { permanent: false, direction: "top" });

    // Sync current frame
    if (frames[index]) {
      const layer = L.tileLayer(frames[index].tileUrlTemplate, {
        opacity: ACTIVE_OPACITY, zIndex: 5, crossOrigin: true, maxZoom: 11, minZoom: 3,
      });
      layer.addTo(map);
      fsLayersRef.current = [layer];
    }

    return () => { map.remove(); fsMapRef.current = null; fsLayersRef.current = []; };
  }, [isFullscreen, city.id, city.latitude, city.longitude, city.name, frames, index]);

  // Fetch radar frames
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const bundle = await getRadarBundle({ size: 256, color: 2 });
        if (!active) return;
        setFrames(bundle.frames);
        setIndex(bundle.defaultIndex);
        setError(null);
      } catch (e) { if (active) setError((e as Error).message); }
    };
    load();
    const refresh = window.setInterval(load, 10 * 60 * 1000);
    return () => { active = false; window.clearInterval(refresh); };
  }, []);

  // Build inline layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const layer of layersRef.current) map.removeLayer(layer);
    layersRef.current = [];
    for (const f of frames) {
      const layer = L.tileLayer(f.tileUrlTemplate, { opacity: 0, zIndex: 5, crossOrigin: true, maxZoom: 11, minZoom: 3 });
      layer.addTo(map); layersRef.current.push(layer);
    }
  }, [frames]);

  // Show active inline frame
  useEffect(() => {
    layersRef.current.forEach((layer, i) => layer.setOpacity(i === index ? ACTIVE_OPACITY : 0));
  }, [index, frames]);

  // Show active fullscreen frame
  useEffect(() => {
    if (!isFullscreen || !fsMapRef.current) return;
    fsLayersRef.current.forEach(l => fsMapRef.current!.removeLayer(l));
    fsLayersRef.current = [];
    if (frames[index]) {
      const layer = L.tileLayer(frames[index].tileUrlTemplate, { opacity: ACTIVE_OPACITY, zIndex: 5, crossOrigin: true, maxZoom: 11, minZoom: 3 });
      layer.addTo(fsMapRef.current); fsLayersRef.current.push(layer);
    }
  }, [index, frames, isFullscreen]);

  // Playback loop
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    tickRef.current = window.setInterval(() => setIndex(i => (i + 1) % frames.length), FRAME_INTERVAL_MS);
    return () => { if (tickRef.current !== null) window.clearInterval(tickRef.current); };
  }, [playing, frames.length]);

  const currentFrame = frames[index];
  const label = useMemo(() => {
    if (!currentFrame) return "—";
    const d = new Date(currentFrame.timestamp);
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return currentFrame.forecast ? `${time} (forecast)` : time;
  }, [currentFrame]);

  const frameCount = frames.length;
  const sliderValue = frameCount > 0 ? index + 1 : 0;

  return (
    <>
      <section className="card radar fade-in" style={{ background: surface }}>
        <div className="card-caption" style={{ justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>🛰️</span> Precipitation Radar
          </span>
          <button
            className="radar-btn"
            style={{ width: "auto", height: "auto", padding: "6px 12px", fontSize: 13 }}
            onClick={() => setIsFullscreen(true)}
            aria-label="Open fullscreen radar"
          >
            ⛶ Fullscreen
          </button>
        </div>
        <div className="radar-map-wrap">
          <div ref={containerRef} className="radar-map" />
          {error && <div className="radar-error">{error}</div>}
        </div>
        <div className="radar-controls">
          <button className="radar-btn" onClick={() => setPlaying(p => !p)} disabled={frames.length === 1} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "⏸" : "▶"}
          </button>
          <input type="range" min={1} max={Math.max(1, frameCount)} value={sliderValue}
            onChange={e => { setPlaying(false); setIndex(Number(e.target.value) - 1); }}
            className="radar-scrub" disabled={frameCount <= 1} />
          <span className="radar-time">{label}</span>
        </div>
      </section>

      {isFullscreen && (
        <div className="radar-fs-overlay" onClick={() => setIsFullscreen(false)}>
          <div className="radar-fs-sheet" onClick={e => e.stopPropagation()}>
            <div className="radar-fs-header">
              <span className="radar-fs-title">🛰️ Precipitation Radar</span>
              <button className="radar-fs-close" onClick={() => setIsFullscreen(false)} aria-label="Close">✕</button>
            </div>
            <div className="radar-fs-map-wrap">
              <div ref={fsContainerRef} className="radar-fs-map" />
            </div>
            <div className="radar-fs-controls">
              <button className="radar-btn" onClick={() => setPlaying(p => !p)} disabled={frameCount <= 1}>{playing ? "⏸" : "▶"}</button>
              <input type="range" min={1} max={Math.max(1, frameCount)} value={sliderValue}
                onChange={e => { setPlaying(false); setIndex(Number(e.target.value) - 1); }}
                className="radar-scrub" disabled={frameCount <= 1} />
              <span className="radar-time">{label}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
