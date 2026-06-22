import { useEffect, useState } from "react";
import type { City } from "../../data/types";
import { searchCities } from "../../services/locationService";
import { useAppStore } from "../../store/useAppStore";

interface Props {
  onClose: () => void;
}

export function CitySearch({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const addCity = useAppStore((s) => s.addCity);

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const r = await searchCities(query);
        if (active) setResults(r);
      } finally {
        if (active) setLoading(false);
      }
    }, 280);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const pick = (city: City) => {
    addCity(city);
    onClose();
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Search for a city or airport"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div style={{ marginTop: 12 }}>
          {loading && (
            <div className="r-sub" style={{ padding: 8 }}>
              Searching…
            </div>
          )}
          {!loading &&
            results.map((c) => (
              <div className="result" key={c.id} onClick={() => pick(c)}>
                <div>
                  <div className="r-name">{c.name}</div>
                  <div className="r-sub">
                    {[c.region, c.country].filter(Boolean).join(", ")}
                  </div>
                </div>
                <span>＋</span>
              </div>
            ))}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="r-sub" style={{ padding: 8 }}>
              No matches.
            </div>
          )}
        </div>
        <button className="close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
