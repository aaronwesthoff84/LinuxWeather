import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { WeatherAlert } from "../../services/alertService";

export function AlertBanner() {
  const selectedId = useAppStore((s) => s.selectedId);
  const settings = useAppStore((s) => s.settings);
  const alertsByCity = useAppStore((s) => s.alertsByCity);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!settings.showAlerts || !selectedId) return null;

  const alerts = alertsByCity[selectedId] || [];
  if (alerts.length === 0) return null;

  const getBgColor = (severity: WeatherAlert["severity"]) => {
    switch (severity) {
      case "Extreme":
        return "linear-gradient(135deg, #d72638, #b71c1c)";
      case "Severe":
        return "linear-gradient(135deg, #f57c00, #e65100)";
      case "Moderate":
        return "linear-gradient(135deg, #fbc02d, #f57f17)";
      case "Minor":
      default:
        return "linear-gradient(135deg, #546e7a, #37474f)";
    }
  };

  return (
    <div className="alert-banners-wrapper" style={{ marginTop: "16px" }}>
      {alerts.map((alert) => {
        const isExpanded = expandedId === alert.id;
        return (
          <div
            key={alert.id}
            className="alert-banner-container fade-in"
            style={{ background: getBgColor(alert.severity) }}
            onClick={() => setExpandedId(isExpanded ? null : alert.id)}
          >
            <div className="alert-banner-header">
              <div className="alert-banner-title">
                <span>⚠️</span>
                <span>{alert.title}</span>
              </div>
              <span>{isExpanded ? "▲" : "▼"}</span>
            </div>
            {isExpanded && (
              <div className="alert-banner-desc" onClick={(e) => e.stopPropagation()}>
                <p>{alert.description}</p>
                {alert.url && alert.url.startsWith("http") && (
                  <div className="alert-banner-link">
                    <a href={alert.url} target="_blank" rel="noreferrer" style={{ color: "#fff" }}>
                      View official NWS alert page ›
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
