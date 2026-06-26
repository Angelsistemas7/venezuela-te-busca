// Coordenadas aproximadas para ubicar registros en el mapa. No pretende ser
// catastral: sirve para visualizar concentraciones y puntos de ayuda. Cuando
// haya datos con lat/lng reales, se usarán esos en su lugar.

export type LatLng = [number, number];

// Centroides aproximados de los estados de Venezuela.
export const ESTADO_COORDS: Record<string, LatLng> = {
  Amazonas: [4.0, -65.5],
  Anzoátegui: [9.3, -64.4],
  Apure: [7.0, -68.5],
  Aragua: [10.2, -67.4],
  Barinas: [8.6, -70.2],
  Bolívar: [6.0, -63.0],
  Carabobo: [10.2, -68.0],
  Cojedes: [9.4, -68.4],
  "Delta Amacuro": [9.0, -61.3],
  "Distrito Capital": [10.5, -66.92],
  Falcón: [11.2, -69.8],
  Guárico: [9.0, -66.5],
  "La Guaira": [10.6, -66.93],
  Lara: [10.0, -69.8],
  Mérida: [8.6, -71.1],
  Miranda: [10.2, -66.4],
  Monagas: [9.5, -63.0],
  "Nueva Esparta": [11.0, -63.9],
  Portuguesa: [9.0, -69.7],
  Sucre: [10.45, -63.5],
  Táchira: [7.8, -72.2],
  Trujillo: [9.3, -70.4],
  Yaracuy: [10.3, -68.8],
  Zulia: [10.0, -72.0],
};

// Sectores conocidos (sobre todo de La Guaira, la zona más afectada).
export const SECTOR_COORDS: Record<string, LatLng> = {
  macuto: [10.605, -66.89],
  "catia la mar": [10.595, -67.025],
  catialamar: [10.595, -67.025],
  maiquetía: [10.598, -66.975],
  maiquetia: [10.598, -66.975],
  "la guaira": [10.601, -66.931],
  caraballeda: [10.612, -66.84],
  naiguatá: [10.617, -66.74],
  naiguata: [10.617, -66.74],
  "camurí grande": [10.617, -66.7],
  "camuri grande": [10.617, -66.7],
  "playa grande": [10.607, -67.0],
  caribe: [10.61, -66.98],
  "los corales": [10.61, -66.85],
  tanaguarena: [10.617, -66.815],
  anare: [10.62, -66.78],
  "el cojo": [10.606, -66.88],
  "punta de mulatos": [10.607, -66.87],
  higuerote: [10.48, -66.1],
  caracas: [10.5, -66.92],
  "el junquito": [10.435, -67.05],
  junquito: [10.435, -67.05],
  "catia": [10.52, -66.93],
  petare: [10.47, -66.8],
  guarenas: [10.47, -66.61],
  guatire: [10.47, -66.54],
  vargas: [10.6, -66.93],
};

// ── Datos oficiales del terremoto (fuentes públicas, jun. 2026) ─────────────
// Doble sismo M7,2 + M7,5 (~39 s), epicentro ~28 km al SE de Yumare (Yaracuy),
// profundidad 10 km. Zona más afectada: La Guaira (Caraballeda, Catia La Mar).
export const EPICENTER: LatLng = [10.45, -68.5];

export const QUAKE_INFO = {
  magnitude: "7,2 y 7,5",
  depthKm: 10,
  epicenterText: "≈28 km al SE de Yumare (Yaracuy)",
  date: "24–25 de junio de 2026",
  deaths: 235,
  injured: 4300,
  mostAffected: "La Guaira (Caraballeda, Catia La Mar)",
  alsoAffected: ["Falcón", "Miranda", "Carabobo (Valencia)", "Aragua (Maracay)", "Distrito Capital (Caracas)"],
  sourceName: "CNN, Euronews, Wikipedia",
};

/** Pequeño desplazamiento determinista para que los puntos no se solapen. */
function jitter(coord: LatLng, seed: string): LatLng {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const dx = ((h % 100) / 100 - 0.5) * 0.04;
  const dy = (((h >> 8) % 100) / 100 - 0.5) * 0.04;
  return [coord[0] + dy, coord[1] + dx];
}

/** Resuelve coordenadas a partir de texto de ubicación y/o estado. */
export function geocode(
  locationText: string | null | undefined,
  estado: string | null | undefined,
  seed = "",
): LatLng | null {
  const text = (locationText ?? "").toLowerCase();
  for (const [name, coord] of Object.entries(SECTOR_COORDS)) {
    if (text.includes(name)) return jitter(coord, seed || name);
  }
  if (estado && ESTADO_COORDS[estado]) return jitter(ESTADO_COORDS[estado], seed || estado);
  return null;
}
