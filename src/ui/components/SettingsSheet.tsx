// ── UI LAYER: Settings sheet (iOS-style modal page) ──

import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  APP_VERSION,
  REFRESH_OPTIONS,
} from "../../services/settingsService";

interface Props {
  onClose: () => void;
}

export function SettingsSheet({ onClose }: Props) {
  const settings = useAppStore((s) => s.settings);
  const cities = useAppStore((s) => s.cities);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const removeCity = useAppStore((s) => s.removeCity);
  const resetAll = useAppStore((s) => s.resetAll);

  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet settings-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="settings-done" onClick={onClose}>
            Done
          </button>
        </div>

        <div className="settings-scroll">
          {/* ── Units ────────────────────────────────────── */}
          <Section title="Units">
            <Row label="Temperature">
              <Segmented
                value={settings.unit}
                options={[
                  { value: "celsius", label: "°C" },
                  { value: "fahrenheit", label: "°F" },
                ]}
                onChange={(v) =>
                  updateSettings({ unit: v as "celsius" | "fahrenheit" })
                }
              />
            </Row>
          </Section>

          {/* ── Display ──────────────────────────────────── */}
          <Section title="Display">
            <ToggleRow
              label="Show Radar Map"
              hint="Live precipitation overlay on the forecast page."
              checked={settings.showRadar}
              onChange={(v) => updateSettings({ showRadar: v })}
            />
            <ToggleRow
              label="Show Weather Alerts"
              hint="Surfaces active weather warnings from NOAA/NWS above the forecast."
              checked={settings.showAlerts ?? true}
              onChange={(v) => updateSettings({ showAlerts: v })}
            />
            <ToggleRow
              label="System Tray Icon"
              hint="Shows a quick weather glance icon in your desktop system tray or menu bar."
              checked={settings.showTray ?? true}
              onChange={(v) => updateSettings({ showTray: v })}
            />
            <ToggleRow
              label="Reduced Motion"
              hint="Disables the animated background and weather particles."
              checked={settings.reducedMotion}
              onChange={(v) => updateSettings({ reducedMotion: v })}
            />
          </Section>

          {/* ── Data ─────────────────────────────────────── */}
          <Section title="Data">
            <Row label="Auto-refresh">
              <select
                className="settings-select"
                value={settings.autoRefreshMinutes}
                onChange={(e) =>
                  updateSettings({
                    autoRefreshMinutes: Number(e.target.value),
                  })
                }
              >
                {REFRESH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Row>
            <ToggleRow
              label="Detect Location on First Launch"
              hint="When the app has no saved cities, try to use your current location automatically."
              checked={settings.autoDetectOnFirstLaunch}
              onChange={(v) =>
                updateSettings({ autoDetectOnFirstLaunch: v })
              }
            />
          </Section>

          {/* ── API ──────────────────────────────────────── */}
          <Section
            title="API"
            hint="Open-Meteo (the default provider) requires no API key. Leave this empty unless you've swapped in a paid provider in src/data/openMeteoClient.ts."
          >
            <Row label="API Key" stackOnSmall>
              <input
                type="password"
                placeholder="(optional)"
                className="settings-input"
                value={settings.apiKey}
                onChange={(e) => updateSettings({ apiKey: e.target.value })}
                autoComplete="off"
                spellCheck={false}
              />
            </Row>
          </Section>

          {/* ── Cities ───────────────────────────────────── */}
          <Section title={`Saved Cities (${cities.length})`}>
            {cities.length === 0 && (
              <div className="settings-empty">No cities yet.</div>
            )}
            {cities.map((c) => {
              const hasAlerts = useAppStore.getState().alertsByCity[c.id]?.length > 0;
              return (
                <div className="settings-city" key={c.id}>
                  <div>
                    <div className="settings-city-name">
                      {c.name}
                      {c.isCurrent && (
                        <span className="settings-badge">Current</span>
                      )}
                      {hasAlerts && settings.showAlerts && (
                        <span className="city-badge-alert">Alert</span>
                      )}
                    </div>
                    <div className="settings-city-sub">
                      {[c.region, c.country].filter(Boolean).join(", ")}
                    </div>
                  </div>
                  <button
                    className="settings-remove"
                    onClick={() => removeCity(c.id)}
                    aria-label={`Remove ${c.name}`}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </Section>

          {/* ── About ────────────────────────────────────── */}
          <Section title="About">
            <Row label="Version">
              <span className="settings-value">{APP_VERSION}</span>
            </Row>
            <Row label="Forecast Data">
              <a
                className="settings-link"
                href="https://open-meteo.com"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo
              </a>
            </Row>
            <Row label="Radar Data">
              <a
                className="settings-link"
                href="https://rainviewer.com"
                target="_blank"
                rel="noreferrer"
              >
                RainViewer
              </a>
            </Row>
            <Row label="Source">
              <a
                className="settings-link"
                href="https://github.com/aaronwesthoff84/LinuxWeather"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </Row>
          </Section>

          {/* ── Reset ────────────────────────────────────── */}
          <Section title="Reset">
            {!confirmingReset && (
              <button
                className="settings-danger"
                onClick={() => setConfirmingReset(true)}
              >
                Clear All Data
              </button>
            )}
            {confirmingReset && (
              <div className="settings-confirm">
                <div className="settings-confirm-text">
                  This will delete all saved cities and reset settings to
                  defaults. Continue?
                </div>
                <div className="settings-confirm-buttons">
                  <button
                    className="settings-cancel"
                    onClick={() => setConfirmingReset(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="settings-danger"
                    onClick={() => {
                      resetAll();
                      setConfirmingReset(false);
                      onClose();
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Small presentational primitives used only by this sheet.
// ─────────────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
}

function Section({ title, hint, children }: SectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-title">{title}</div>
      <div className="settings-section-body">{children}</div>
      {hint && <div className="settings-section-hint">{hint}</div>}
    </div>
  );
}

interface RowProps {
  label: string;
  children: React.ReactNode;
  stackOnSmall?: boolean;
}

function Row({ label, children, stackOnSmall }: RowProps) {
  return (
    <div className={`settings-row ${stackOnSmall ? "stack" : ""}`}>
      <span className="settings-label">{label}</span>
      <span className="settings-control">{children}</span>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, hint, checked, onChange }: ToggleRowProps) {
  return (
    <div className="settings-row settings-toggle-row">
      <div className="settings-toggle-text">
        <span className="settings-label">{label}</span>
        {hint && <span className="settings-hint">{hint}</span>}
      </div>
      <button
        className={`settings-switch ${checked ? "on" : ""}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="settings-switch-knob" />
      </button>
    </div>
  );
}

interface SegmentedProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

function Segmented({ value, options, onChange }: SegmentedProps) {
  return (
    <div className="settings-segmented">
      {options.map((o) => (
        <button
          key={o.value}
          className={`settings-segment ${value === o.value ? "active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
