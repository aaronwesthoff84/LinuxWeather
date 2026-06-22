import type { City, NormalizedWeather } from "../../data/types";
import { labelFor } from "../../data/weatherCodes";
import { degrees } from "../../services/unitService";

interface Props {
  city: City;
  weather: NormalizedWeather;
}

export function HeroHeader({ city, weather }: Props) {
  const { current, todayHigh, todayLow } = weather;
  return (
    <header className="hero fade-in">
      <div className="city">{city.name}</div>
      <div className="temp">{degrees(current.temperature)}</div>
      <div className="summary">{labelFor(current.weatherCode)}</div>
      <div className="hilo">
        H:{degrees(todayHigh)} &nbsp; L:{degrees(todayLow)}
      </div>
    </header>
  );
}
