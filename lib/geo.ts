export type Place = { lat: number; lon: number; display_name: string; place_id: number };
export type Route = { distance: number; duration: number; geometry: { coordinates: [number, number][] }; legs: { summary: string }[] };

export async function searchPlaces(query: string): Promise<Place[]> {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Place search is temporarily unavailable.");
  return response.json();
}

export async function walkingRoutes(start: [number, number], end: [number, number]): Promise<Route[]> {
  const coords = `${start[1]},${start[0]};${end[1]},${end[0]}`;
  const response = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`);
  if (!response.ok) throw new Error("Walking routes are temporarily unavailable.");
  const result = await response.json();
  if (result.code !== "Ok" || !result.routes?.length) throw new Error("No walking route was found for these locations.");
  return result.routes;
}

export async function getWeather(lat: number, lon: number) {
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1`);
  if (!response.ok) throw new Error("Weather service is currently unavailable.");
  return response.json();
}