import { useAppStore } from "../../store/useAppStore";
import { degrees } from "../../services/unitService";
import { labelFor, glyphFor } from "../../data/weatherCodes";
import { upcomingHours } from "../../services/weatherService";
import { hourLabel } from "../../utils/format";

interface Props {
  onClose: () => void;
}

export function TrayPopup({ onClose }: Props) {
  const cities = useAppStore((s) => s.cities);
  const selectedId = useAppStore((s) => s.selectedId);
  const weatherByCity = useAppStore((s) => s.weatherByCity);

  const selectedCity = cities.find((c) => c.id === selectedId) ?? null;
  const entry = selectedId ? weatherByCity[selectedId] : undefined;

  return (
    <div className="sheet-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="sheet fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "320px", padding: "16px", borderRadius: "20px", background: "rgba(28, 32, 40, 0.95)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "8px" }}>
          <span style={{ fontSize: "16px", fontWeight: 600 }}>Weather Glance</span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#7fc4ff", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
          >
            ✕
          </button>
        </div>

        {!selectedCity && <div className="status" style={{ padding: "40px 10px", fontSize: "14px" }}>No city selected.</div>}
        {selectedCity && entry?.status === "loading" && <div className="status" style={{ padding: "40px 10px", fontSize: "14px" }}>Loading {selectedCity.name}…</div>}
        {selectedCity && entry?.status === "error" && <div className="status" style={{ padding: "40px 10px", fontSize: "14px" }}>Could not load weather.</div>}

        {selectedCity && entry?.status === "ready" && entry.data && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ fontSize: "20px", fontWeight: 500 }}>{selectedCity.name}</div>
              <div style={{ fontSize: "56px", fontWeight: 200, lineHeight: 1, margin: "8px 0" }}>
                {degrees(entry.data.current.temperature)}
              </div>
              <div style={{ fontSize: "16px", fontWeight: 500 }}>
                {labelFor(entry.data.current.weatherCode)}
              </div>
              <div style={{ fontSize: "14px", opacity: 0.8, marginTop: "4px" }}>
                H:{degrees(entry.data.todayHigh)} &nbsp; L:{degrees(entry.data.todayLow)}
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.06)", borderRadius: "14px", padding: "12px" }}>
              <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 600, opacity: 0.7, marginBottom: "8px" }}>
                Upcoming Hours
              </div>
              <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "6px", scrollbarWidth: "none" }}>
                {upcomingHours(entry.data, 12).map((h, i) => (
                  <div key={h.time} style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "12px", opacity: 0.8 }}>{hourLabel(h.time, i)}</span>
                    <span style={{ fontSize: "18px" }}>{glyphFor(h.weatherCode, h.isDay)}</span>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>{degrees(h.temperature)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
