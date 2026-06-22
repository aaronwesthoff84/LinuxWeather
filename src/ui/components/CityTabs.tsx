import { useAppStore } from "../../store/useAppStore";

export function CityTabs() {
  const cities = useAppStore((s) => s.cities);
  const selectedId = useAppStore((s) => s.selectedId);
  const selectCity = useAppStore((s) => s.selectCity);

  if (cities.length <= 1) return null;

  return (
    <div className="city-tabs">
      {cities.map((c) => (
        <button
          key={c.id}
          className={`city-dot ${c.id === selectedId ? "active" : ""}`}
          title={c.name}
          onClick={() => selectCity(c.id)}
        />
      ))}
    </div>
  );
}
