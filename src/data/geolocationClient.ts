// ── DATA-ACCESS LAYER: resolve the user's current location ──
// Strategy: browser Geolocation API first; if unavailable/denied, fall back
// to a key-free IP lookup (ipapi.co).

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  name?: string;
  country?: string;
}

function browserGeolocation(): Promise<DetectedLocation> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  });
}

async function ipGeolocation(): Promise<DetectedLocation> {
  const res = await fetch("https://ipapi.co/json/", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("IP geolocation failed");
  const data = (await res.json()) as {
    latitude: number;
    longitude: number;
    city?: string;
    country_name?: string;
  };
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    name: data.city,
    country: data.country_name,
  };
}

export async function detectLocation(): Promise<DetectedLocation> {
  try {
    return await browserGeolocation();
  } catch {
    return await ipGeolocation();
  }
}
