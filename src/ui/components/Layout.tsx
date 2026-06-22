// ── UI LAYER: responsive layout shell (sidebar on desktop, stacked on mobile) ──

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "../../store/useAppStore";
import { detectCurrentCity } from "../../services/locationService";
import { CitySearch } from "./CitySearch";
import { SettingsSheet } from "./SettingsSheet";

interface Props {
  children: React.ReactNode;
}

export function Layout({ children }: Props) {
  const cities = useAppStore((s) => s.cities);
  const selectedId = useAppStore((s) => s.selectedId);
  const selectCity = useAppStore((s) => s.selectCity);
  const addCity = useAppStore((s) => s.addCity);
  const removeCity = useAppStore((s) => s.removeCity);

  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 900 : false
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleDetect = useCallback(async () => {
    setDetecting(true);
    try {
      const city = await detectCurrentCity();
      addCity(city);
    } catch (e) {
      alert("Could not detect location: " + (e as Error).message);
    } finally {
      setDetecting(false);
    }
  }, [addCity]);

  return (
    <div className={`layout ${sidebarCollapsed ? "collapsed" : ""} ${isDesktop ? "desktop" : "mobile"}`}>
      {/* ── Sidebar (desktop only, hidden on mobile) ── */}
      {isDesktop && (
        <aside className="sidebar">
          {/* Collapsed state: just the expand button */}
          {sidebarCollapsed && (
            <button
              className="sidebar-expand-btn"
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              →
            </button>
          )}

          {/* Expanded state: full sidebar content */}
          {!sidebarCollapsed && (
            <>
              <div className="sidebar-header">
                <span className="sidebar-title">Weather</span>
                <button
                  className="sidebar-toggle"
                  onClick={() => setSidebarCollapsed(true)}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  ←
                </button>
              </div>

              <div className="sidebar-actions">
                <button
                  className="sidebar-btn primary"
                  onClick={() => setSearchOpen(true)}
                >
                  ＋ Add City
                </button>
                <button
                  className="sidebar-btn"
                  onClick={handleDetect}
                  disabled={detecting}
                >
                  {detecting ? "Locating…" : "📍 Detect Location"}
                </button>
              </div>

              <nav className="sidebar-nav">
                {cities.length === 0 && (
                  <div className="sidebar-empty">
                    No cities yet.
                    <br />
                    Add one to get started.
                  </div>
                )}
                {cities.map((c) => (
                  <button
                    key={c.id}
                    className={`sidebar-city ${c.id === selectedId ? "active" : ""}`}
                    onClick={() => selectCity(c.id)}
                  >
                    <div className="sidebar-city-name">
                      {c.name}
                      {c.isCurrent && (
                        <span className="sidebar-badge">Current</span>
                      )}
                    </div>
                    <div className="sidebar-city-sub">
                      {[c.region, c.country].filter(Boolean).join(", ")}
                    </div>
                    {cities.length > 1 && (
                      <span
                        className="sidebar-city-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCity(c.id);
                        }}
                        aria-label={`Remove ${c.name}`}
                        title="Remove"
                      >
                        ×
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="sidebar-footer">
                <button
                  className="sidebar-btn ghost"
                  onClick={() => setSettingsOpen(true)}
                >
                  ⚙ Settings
                </button>
              </div>
            </>
          )}
        </aside>
      )}

      {/* ── Mobile top bar (hidden on desktop) ── */}
      {!isDesktop && (
        <div className="mobile-topbar">
          <button onClick={handleDetect} disabled={detecting}>
            {detecting ? "…" : "📍"}
          </button>
          <span className="mobile-title">Weather</span>
          <button onClick={() => setSettingsOpen(true)}>⚙</button>
          <button onClick={() => setSearchOpen(true)}>＋</button>
        </div>
      )}

      {/* ── Main content area ── */}
      <main className="main">
        {children}
      </main>

      {searchOpen && <CitySearch onClose={() => setSearchOpen(false)} />}
      {settingsOpen && (
        <SettingsSheet onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
