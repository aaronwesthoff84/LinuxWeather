import type { ReactNode } from "react";

interface Props {
  caption: string;
  icon: string;
  value: ReactNode;
  sub?: string;
  /** 0..1 severity position; renders a gradient bar + knob when provided */
  severity?: number;
  surface: string;
}

export function DetailCard({
  caption,
  icon,
  value,
  sub,
  severity,
  surface,
}: Props) {
  return (
    <div className="card detail-card" style={{ background: surface }}>
      <div className="card-caption">
        <span>{icon}</span> {caption}
      </div>
      <div className="value">{value}</div>
      {severity !== undefined && (
        <div className="sev-bar">
          <span
            className="sev-knob"
            style={{ left: `${Math.min(100, Math.max(0, severity * 100))}%` }}
          />
        </div>
      )}
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
