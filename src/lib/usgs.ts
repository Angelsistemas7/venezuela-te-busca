import "server-only";

// Sismos recientes alrededor de Venezuela desde la API pública y GRATUITA del
// USGS (Servicio Geológico de EE. UU.). No requiere clave. Los sismos no se
// pueden predecir; esto solo muestra la actividad real reciente.

export interface Quake {
  id: string;
  mag: number;
  place: string;
  time: number; // epoch ms
  url: string;
}

// Caja aproximada que cubre Venezuela y su entorno cercano.
const BBOX = { minLat: 0, maxLat: 13.5, minLon: -74, maxLon: -59 };

export async function getRecentQuakes(limit = 12, minMagnitude = 3.5): Promise<Quake[]> {
  try {
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const params = new URLSearchParams({
      format: "geojson",
      starttime: start,
      minmagnitude: String(minMagnitude),
      minlatitude: String(BBOX.minLat),
      maxlatitude: String(BBOX.maxLat),
      minlongitude: String(BBOX.minLon),
      maxlongitude: String(BBOX.maxLon),
      orderby: "time",
      limit: String(limit),
    });
    const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`, {
      // Revalida cada 30 min: datos frescos sin golpear la API en cada visita.
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      features?: { id: string; properties: { mag: number; place: string; time: number; url: string } }[];
    };
    return (json.features ?? [])
      .filter((f) => typeof f.properties?.mag === "number")
      .map((f) => ({
        id: f.id,
        mag: f.properties.mag,
        place: f.properties.place ?? "Venezuela",
        time: f.properties.time,
        url: f.properties.url,
      }));
  } catch {
    return []; // si la API falla, la UI muestra un aviso suave
  }
}
