import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { City } from "../../data/types";
import { getRadarBundle, type RadarFrame } from "../../services/radarService";

interface Props {
  city: City;
  surface: string;
  /** When true, the animation timer is stopped. */
  paused?: boolean;
}

const FRAME_INTERVAL_MS = 500;
const ACTIVE_OPACITY = 0.7;

export function RadarMap({ city, surface, paused = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.TileLayer[]>([]);
  const tickRef = useRef<number | null>(null);

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Build / refresh the Leaflet map whenever the selected city changes.
  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [city.latitude, city.longitude],
      zoom: 7,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> · Radar © <a href="https://rainviewer.com">RainViewer</a>',
      maxZoom: 11,
      minZoom: 3,
      className: "osm-base",
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    L.circleMarker([city.latitude, city.longitude], {
      radius: 6,
      color: "#fff",
      fillColor: "#ffd65a",
      fillOpacity: 1,
      weight: 2,
    })
      .addTo(map)
      .bindTooltip(city.name, { permanent: false, direction: "top" });

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = [];
    };
  }, [city.id, city.latitude, city.longitude, city.name]);

  // 2. Fetch radar frames once on mount (and again every 10 minutes).
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const bundle = await getRadarBundle({ size: 256, color: 2 });
        if (!active) return;
        setFrames(bundle.frames);
        setIndex(bundle.defaultIndex);
        setError(null);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const refresh = window.setInterval(load, 10 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  // 3. Whenever frames change, rebuild the per-frame tile layers (hidden).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const layer of layersRef.current) {
      map.removeLayer(layer);
    }
    layersRef.current = [];

    for (const f of frames) {
      const layer = L.tileLayer(f.tileUrlTemplate, {
        opacity: 0,
        zIndex: 5,
        crossOrigin: true,
        maxZoom: 11,
        minZoom: 3,
      });
      layer.addTo(map);
      layersRef.current.push(layer);
    }
  }, [frames]);

  // 4. Show the active frame; hide everything else.
  useEffect(() => {
    layersRef.current.forEach((layer, i) => {
      layer.setOpacity(i === index ? ACTIVE_OPACITY : 0);
    });
  }, [index, frames]);

  // 5. Playback loop — respects the paused prop.
  useEffect(() => {
    if (paused || frames.length === 1) return;
    tickRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, FRAME_INTERVAL_MS);
    return () => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [paused, frames.length]);

  const currentFrame = frames[index];
  const label = useMemo(() => {
    if (!currentFrame) return "—";
    const d = new Date(currentFrame.timestamp);
    const time = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return currentFrame.forecast ? `${time} (forecast)` : time;
  }, [currentFrame]);

  return (
    <section className="card radar fade-in" style={{ background: surface }}>
      <div className="card-caption">🛰️ Precipitation Radar</div>
      <div className="radar-map-wrap">
        <div ref={containerRef} className="radar-map" />
        {loading && <div className="radar-loading">Loading radar…</div>}
        {error && <div className="radar-error">{error}</div>}
      </div>
      <div className="radar-controls">
        <button
          className="radar-btn"
          onClick={() => setIndex((i) => Math.max(1, i - 1))}
          disabled={frames.length <= 1}
          aria-label="Previous frame"
        >
          ‹
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, frames.length - 1)}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="radar-scrub"
          disabled={frames.length <= 1}
        />
        <span className="radar-time">{label}</span>
      </div>
    </section>
  );
}
